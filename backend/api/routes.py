from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import Optional, List
import json
from datetime import datetime

from models.database import get_db
from models.schemas import ScrapeRequest

router = APIRouter()


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats():
    conn = get_db()
    try:
        wealthy_count = conn.execute("SELECT COUNT(*) FROM wealthy_users").fetchone()[0]
        post_count = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        hashtag_count = conn.execute("SELECT COUNT(*) FROM hashtags").fetchone()[0]
        brand_count = conn.execute("SELECT COUNT(*) FROM brand_mentions").fetchone()[0]
        followed_count = conn.execute(
            "SELECT COUNT(DISTINCT followed_user_id) FROM followed_accounts"
        ).fetchone()[0]

        return {
            "wealthy_users": wealthy_count,
            "posts_analyzed": post_count,
            "trending_hashtags": hashtag_count,
            "brand_mentions": brand_count,
            "tracked_influencers": followed_count,
        }
    finally:
        conn.close()


# ─── Wealthy Users ────────────────────────────────────────────────────────────

@router.get("/wealthy-users")
def get_wealthy_users(
    limit: int = Query(20, le=100),
    offset: int = 0,
    sort_by: str = "wealth_score",
):
    valid_sorts = ["wealth_score", "followers", "updated_at"]
    if sort_by not in valid_sorts:
        sort_by = "wealth_score"

    conn = get_db()
    try:
        rows = conn.execute(f"""
            SELECT * FROM wealthy_users
            ORDER BY {sort_by} DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()

        users = []
        for row in rows:
            u = dict(row)
            if u.get("wealth_signals"):
                try:
                    u["wealth_signals"] = json.loads(u["wealth_signals"])
                except Exception:
                    u["wealth_signals"] = []
            users.append(u)

        total = conn.execute("SELECT COUNT(*) FROM wealthy_users").fetchone()[0]
        return {"users": users, "total": total}
    finally:
        conn.close()


@router.get("/wealthy-users/{user_id}")
def get_wealthy_user(user_id: str):
    conn = get_db()
    try:
        user = conn.execute(
            "SELECT * FROM wealthy_users WHERE id = ?", (user_id,)
        ).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        u = dict(user)
        if u.get("wealth_signals"):
            u["wealth_signals"] = json.loads(u["wealth_signals"])

        # Get their posts
        posts = conn.execute(
            "SELECT * FROM posts WHERE user_id = ? ORDER BY likes DESC LIMIT 10",
            (user_id,)
        ).fetchall()
        u["recent_posts"] = [dict(p) for p in posts]

        # Get who they follow
        following = conn.execute("""
            SELECT followed_user_id, followed_nickname, followed_avatar,
                   followed_followers, followed_url, SUM(follow_count) as total_follows
            FROM followed_accounts
            WHERE wealthy_user_id = ?
            GROUP BY followed_user_id
            ORDER BY total_follows DESC
            LIMIT 20
        """, (user_id,)).fetchall()
        u["following"] = [dict(f) for f in following]

        return u
    finally:
        conn.close()


# ─── Trending Hashtags ────────────────────────────────────────────────────────

@router.get("/hashtags")
def get_hashtags(
    limit: int = Query(20, le=100),
    category: Optional[str] = None,
    sort_by: str = "trending_score",
):
    valid_sorts = ["trending_score", "wealthy_user_count", "total_likes"]
    if sort_by not in valid_sorts:
        sort_by = "trending_score"

    conn = get_db()
    try:
        if category:
            rows = conn.execute(f"""
                SELECT * FROM hashtags WHERE category = ?
                ORDER BY {sort_by} DESC LIMIT ?
            """, (category, limit)).fetchall()
        else:
            rows = conn.execute(f"""
                SELECT * FROM hashtags ORDER BY {sort_by} DESC LIMIT ?
            """, (limit,)).fetchall()

        # Get distinct categories
        categories = conn.execute(
            "SELECT DISTINCT category FROM hashtags WHERE category IS NOT NULL"
        ).fetchall()

        return {
            "hashtags": [dict(r) for r in rows],
            "categories": [r[0] for r in categories],
        }
    finally:
        conn.close()


# ─── Popular Influencers (who wealthy users follow) ───────────────────────────

@router.get("/influencers")
def get_influencers(limit: int = Query(20, le=100), offset: int = 0):
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT
                followed_user_id as id,
                followed_nickname as nickname,
                followed_avatar as avatar,
                followed_followers as followers,
                followed_url as profile_url,
                COUNT(DISTINCT wealthy_user_id) as wealthy_followers,
                SUM(follow_count) as total_follow_count
            FROM followed_accounts
            GROUP BY followed_user_id
            ORDER BY wealthy_followers DESC, total_follow_count DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()

        total = conn.execute(
            "SELECT COUNT(DISTINCT followed_user_id) FROM followed_accounts"
        ).fetchone()[0]

        return {"influencers": [dict(r) for r in rows], "total": total}
    finally:
        conn.close()


# ─── Brand Trends ─────────────────────────────────────────────────────────────

@router.get("/brands")
def get_brands(
    limit: int = Query(20, le=100),
    category: Optional[str] = None,
    sort_by: str = "wealthy_user_count",
):
    valid_sorts = ["wealthy_user_count", "mention_count", "avg_likes"]
    if sort_by not in valid_sorts:
        sort_by = "wealthy_user_count"

    conn = get_db()
    try:
        if category:
            rows = conn.execute(f"""
                SELECT * FROM brand_mentions WHERE category = ?
                ORDER BY {sort_by} DESC LIMIT ?
            """, (category, limit)).fetchall()
        else:
            rows = conn.execute(f"""
                SELECT * FROM brand_mentions ORDER BY {sort_by} DESC LIMIT ?
            """, (limit,)).fetchall()

        categories = conn.execute(
            "SELECT DISTINCT category FROM brand_mentions WHERE category IS NOT NULL"
        ).fetchall()

        return {
            "brands": [dict(r) for r in rows],
            "categories": [r[0] for r in categories],
        }
    finally:
        conn.close()


# ─── Posts ────────────────────────────────────────────────────────────────────

@router.get("/posts")
def get_posts(
    limit: int = Query(20, le=100),
    offset: int = 0,
    wealth_only: bool = True,
):
    conn = get_db()
    try:
        where = "WHERE p.wealth_related = 1" if wealth_only else ""
        rows = conn.execute(f"""
            SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar,
                   u.wealth_score, u.profile_url as author_url
            FROM posts p
            LEFT JOIN wealthy_users u ON p.user_id = u.id
            {where}
            ORDER BY p.likes DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()

        posts = []
        for row in rows:
            p = dict(row)
            if p.get("hashtags"):
                try:
                    p["hashtags"] = json.loads(p["hashtags"])
                except Exception:
                    p["hashtags"] = []
            posts.append(p)

        total = conn.execute(
            f"SELECT COUNT(*) FROM posts {where}"
        ).fetchone()[0]

        return {"posts": posts, "total": total}
    finally:
        conn.close()


# ─── Scraping Jobs ────────────────────────────────────────────────────────────

@router.get("/jobs")
def get_jobs(limit: int = 10):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM scrape_jobs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return {"jobs": [dict(r) for r in rows]}
    finally:
        conn.close()


@router.get("/jobs/{job_id}")
def get_job(job_id: int):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM scrape_jobs WHERE id = ?", (job_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return dict(row)
    finally:
        conn.close()


@router.post("/scrape/start")
async def start_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    conn = get_db()
    try:
        cursor = conn.execute("""
            INSERT INTO scrape_jobs (job_type, status, message, created_at)
            VALUES ('wealth_scrape', 'pending', '准备开始...', ?)
        """, (datetime.now().isoformat(),))
        job_id = cursor.lastrowid
        conn.commit()
    finally:
        conn.close()

    async def run_job():
        try:
            from scraper.xhs_scraper import run_scrape_job
            await run_scrape_job(
                job_id=job_id,
                keywords=request.keywords,
                max_users=request.max_users,
            )
        except Exception as e:
            conn = get_db()
            conn.execute("""
                UPDATE scrape_jobs SET status='failed', message=?, finished_at=?
                WHERE id=?
            """, (str(e), datetime.now().isoformat(), job_id))
            conn.commit()
            conn.close()

    background_tasks.add_task(run_job)
    return {"job_id": job_id, "status": "started"}


@router.post("/scrape/seed-mock")
def seed_mock_data():
    """Seed database with mock data for demo purposes."""
    from scraper.mock_data import seed_mock_data as _seed
    _seed()
    return {"status": "ok", "message": "Mock data seeded successfully"}


@router.post("/scrape/login")
async def trigger_login():
    """Trigger interactive browser login for XHS."""
    from scraper.xhs_scraper import login_interactive
    import asyncio
    asyncio.create_task(login_interactive())
    return {"status": "ok", "message": "Browser login started. Check your screen."}
