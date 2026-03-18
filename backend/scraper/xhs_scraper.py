"""
小红书 (XHS/RED) scraper using Playwright.
Identifies wealthy users and collects their interests.

IMPORTANT: Requires manual login first. Run login() once interactively.
"""

import asyncio
import json
import os
import re
import time
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

try:
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page
except ImportError:
    print("Install playwright: pip install playwright && playwright install chromium")

from scraper.wealth_detector import (
    is_wealthy_user, detect_brands_in_text, extract_hashtags,
    WEALTH_SEARCH_KEYWORDS, calculate_wealth_score
)
from models.database import get_db

COOKIES_PATH = os.path.join(os.path.dirname(__file__), "../data/xhs_cookies.json")
STATE_PATH = os.path.join(os.path.dirname(__file__), "../data/xhs_state.json")
XHS_BASE = "https://www.xiaohongshu.com"


async def random_delay(min_s=1.0, max_s=3.0):
    """Human-like random delay to avoid detection."""
    await asyncio.sleep(random.uniform(min_s, max_s))


async def create_browser_context(playwright) -> tuple:
    """Create browser with anti-detection settings."""
    browser = await playwright.chromium.launch(
        headless=False,  # Must be visible for login and to avoid detection
        args=[
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
        ]
    )

    context_kwargs = {
        "viewport": {"width": 1280, "height": 800},
        "user_agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "locale": "zh-CN",
    }

    # Load saved state if exists
    if os.path.exists(STATE_PATH):
        context_kwargs["storage_state"] = STATE_PATH

    context = await browser.new_context(**context_kwargs)

    # Inject anti-detection scripts
    await context.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh', 'en']});
        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
    """)

    return browser, context


async def login_interactive():
    """
    Open browser for manual login. Save session after login.
    Run this once before scraping.
    """
    async with async_playwright() as p:
        browser, context = await create_browser_context(p)
        page = await context.new_page()

        await page.goto(f"{XHS_BASE}/explore")
        print("请在浏览器中手动登录小红书，登录完成后按 Enter...")
        input()

        # Save session state
        await context.storage_state(path=STATE_PATH)
        print(f"登录状态已保存到 {STATE_PATH}")
        await browser.close()


async def search_posts(page: Page, keyword: str, max_posts: int = 30) -> List[dict]:
    """Search for posts by keyword and collect results."""
    posts = []
    try:
        search_url = f"{XHS_BASE}/search_result?keyword={keyword}&source=web_explore_feed"
        await page.goto(search_url)
        await random_delay(2, 4)

        # Scroll to load more posts
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await random_delay(1.5, 2.5)

        # Extract post cards
        post_cards = await page.query_selector_all("section.note-item, div.note-item, div[class*='note']")

        for card in post_cards[:max_posts]:
            try:
                post = await extract_post_card(card)
                if post:
                    posts.append(post)
            except Exception as e:
                continue

    except Exception as e:
        print(f"Search error for '{keyword}': {e}")

    return posts


async def extract_post_card(card) -> Optional[dict]:
    """Extract data from a post card element."""
    try:
        # Get title
        title_el = await card.query_selector("span.title, div.title, a.title")
        title = await title_el.inner_text() if title_el else ""

        # Get author
        author_el = await card.query_selector("span.author, div.author, a[href*='/user/']")
        author_text = await author_el.inner_text() if author_el else ""

        # Get link
        link_el = await card.query_selector("a[href*='/explore/']")
        href = await link_el.get_attribute("href") if link_el else ""
        post_url = f"{XHS_BASE}{href}" if href else ""
        post_id = re.search(r'/explore/([a-f0-9]+)', href or "")
        post_id = post_id.group(1) if post_id else str(int(time.time() * 1000))

        # Get likes
        likes_el = await card.query_selector("span.like-wrapper span, span[class*='count']")
        likes_text = await likes_el.inner_text() if likes_el else "0"
        likes = parse_count(likes_text)

        # Get image
        img_el = await card.query_selector("img")
        img_src = await img_el.get_attribute("src") if img_el else ""

        return {
            "id": post_id,
            "title": title,
            "author": author_text,
            "url": post_url,
            "likes": likes,
            "image": img_src,
            "content": "",
        }
    except Exception:
        return None


async def get_post_detail(page: Page, post_url: str) -> Optional[dict]:
    """Get full post details including content, hashtags, user info."""
    try:
        await page.goto(post_url)
        await random_delay(2, 3)

        # Content
        content_el = await page.query_selector("div.desc, div[class*='content'] span")
        content = await content_el.inner_text() if content_el else ""

        # Hashtags
        hashtag_els = await page.query_selector_all("a[href*='/search_result?keyword=']")
        hashtags = []
        for el in hashtag_els:
            tag_text = await el.inner_text()
            if tag_text.startswith("#"):
                hashtags.append(tag_text.strip("#"))

        # Comments
        comment_els = await page.query_selector_all("div.comment-item, div[class*='comment']")
        comments = []
        for el in comment_els[:20]:
            try:
                comment_text_el = await el.query_selector("span.content, div.content")
                comment_text = await comment_text_el.inner_text() if comment_text_el else ""
                if comment_text:
                    comments.append({"content": comment_text})
            except Exception:
                continue

        # Author info
        author_el = await page.query_selector("div.author-wrapper, div[class*='author']")
        author_id = ""
        author_name = ""
        author_followers = 0
        author_avatar = ""

        if author_el:
            author_link = await author_el.query_selector("a[href*='/user/']")
            if author_link:
                href = await author_link.get_attribute("href")
                author_id = re.search(r'/user/([a-f0-9]+)', href or "")
                author_id = author_id.group(1) if author_id else ""

            name_el = await author_el.query_selector("span.username, div.name")
            author_name = await name_el.inner_text() if name_el else ""

            img_el = await author_el.query_selector("img")
            author_avatar = await img_el.get_attribute("src") if img_el else ""

        return {
            "content": content,
            "hashtags": hashtags,
            "comments": comments,
            "author_id": author_id,
            "author_name": author_name,
            "author_avatar": author_avatar,
            "author_followers": author_followers,
        }
    except Exception as e:
        print(f"Error getting post detail: {e}")
        return None


async def get_user_profile(page: Page, user_id: str) -> Optional[dict]:
    """Get user profile and their following list."""
    try:
        await page.goto(f"{XHS_BASE}/user/profile/{user_id}")
        await random_delay(2, 4)

        # Bio
        bio_el = await page.query_selector("div.user-desc, span.user-desc")
        bio = await bio_el.inner_text() if bio_el else ""

        # Follower counts
        stats_els = await page.query_selector_all("div.count, span.count")
        following_count = 0
        followers_count = 0
        if len(stats_els) >= 2:
            following_text = await stats_els[0].inner_text()
            followers_text = await stats_els[1].inner_text()
            following_count = parse_count(following_text)
            followers_count = parse_count(followers_text)

        return {
            "id": user_id,
            "bio": bio,
            "following": following_count,
            "followers": followers_count,
        }
    except Exception as e:
        print(f"Error getting user profile {user_id}: {e}")
        return None


async def get_user_following(page: Page, user_id: str, max_accounts: int = 50) -> List[dict]:
    """Get list of accounts a user follows."""
    following = []
    try:
        await page.goto(f"{XHS_BASE}/user/profile/{user_id}/follows")
        await random_delay(2, 3)

        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await random_delay(1, 2)

        user_cards = await page.query_selector_all("div.user-card, div[class*='user-item']")

        for card in user_cards[:max_accounts]:
            try:
                link_el = await card.query_selector("a[href*='/user/']")
                href = await link_el.get_attribute("href") if link_el else ""
                uid = re.search(r'/user/(?:profile/)?([a-f0-9]+)', href or "")
                uid = uid.group(1) if uid else ""

                name_el = await card.query_selector("span.username, div.name")
                name = await name_el.inner_text() if name_el else ""

                img_el = await card.query_selector("img")
                avatar = await img_el.get_attribute("src") if img_el else ""

                fans_el = await card.query_selector("span.fans, span[class*='follower']")
                fans_text = await fans_el.inner_text() if fans_el else "0"

                if uid and name:
                    following.append({
                        "user_id": uid,
                        "nickname": name,
                        "avatar": avatar,
                        "followers": parse_count(fans_text),
                        "profile_url": f"{XHS_BASE}/user/profile/{uid}",
                    })
            except Exception:
                continue

    except Exception as e:
        print(f"Error getting following for {user_id}: {e}")

    return following


def parse_count(text: str) -> int:
    """Parse count strings like '1.2万' -> 12000."""
    if not text:
        return 0
    text = text.strip()
    try:
        if "万" in text:
            return int(float(text.replace("万", "")) * 10000)
        elif "亿" in text:
            return int(float(text.replace("亿", "")) * 100000000)
        else:
            return int(re.sub(r'[^\d]', '', text) or 0)
    except Exception:
        return 0


def save_wealthy_user(user_data: dict, wealth_score: float, signals: List[str]):
    """Save wealthy user to database."""
    conn = get_db()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO wealthy_users
            (id, nickname, avatar, bio, followers, following, wealth_score, wealth_signals, profile_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_data.get("id"),
            user_data.get("nickname") or user_data.get("author_name", ""),
            user_data.get("avatar") or user_data.get("author_avatar", ""),
            user_data.get("bio", ""),
            user_data.get("followers", 0),
            user_data.get("following", 0),
            wealth_score,
            json.dumps(signals, ensure_ascii=False),
            user_data.get("profile_url", f"{XHS_BASE}/user/profile/{user_data.get('id')}"),
            datetime.now().isoformat(),
        ))
        conn.commit()
    finally:
        conn.close()


def save_post(post: dict, user_id: str, hashtags: List[str], is_wealth_related: bool):
    """Save post to database."""
    conn = get_db()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO posts
            (id, user_id, title, content, images, likes, comments, hashtags, url, wealth_related, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            post.get("id"),
            user_id,
            post.get("title", ""),
            post.get("content", ""),
            json.dumps([post.get("image", "")]),
            post.get("likes", 0),
            post.get("comments_count", 0),
            json.dumps(hashtags, ensure_ascii=False),
            post.get("url", ""),
            1 if is_wealth_related else 0,
            datetime.now().isoformat(),
        ))
        conn.commit()
    finally:
        conn.close()


def save_following(wealthy_user_id: str, following_list: List[dict]):
    """Save followed accounts to database."""
    conn = get_db()
    try:
        for account in following_list:
            conn.execute("""
                INSERT INTO followed_accounts
                (wealthy_user_id, followed_user_id, followed_nickname, followed_avatar,
                 followed_followers, followed_url, follow_count)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT DO NOTHING
            """, (
                wealthy_user_id,
                account.get("user_id"),
                account.get("nickname"),
                account.get("avatar"),
                account.get("followers", 0),
                account.get("profile_url"),
            ))
        conn.commit()
    finally:
        conn.close()


def update_hashtag_stats(tag: str, category: str = None, likes: int = 0):
    """Update hashtag statistics."""
    conn = get_db()
    try:
        existing = conn.execute("SELECT * FROM hashtags WHERE tag = ?", (tag,)).fetchone()
        if existing:
            conn.execute("""
                UPDATE hashtags SET
                    wealthy_user_count = wealthy_user_count + 1,
                    total_likes = total_likes + ?,
                    trending_score = wealthy_user_count * 10 + total_likes * 0.001,
                    updated_at = ?
                WHERE tag = ?
            """, (likes, datetime.now().isoformat(), tag))
        else:
            conn.execute("""
                INSERT INTO hashtags (tag, wealthy_user_count, total_likes, category, trending_score, updated_at)
                VALUES (?, 1, ?, ?, ?, ?)
            """, (tag, likes, category, likes * 0.001, datetime.now().isoformat()))
        conn.commit()
    finally:
        conn.close()


def update_brand_stats(brand: str, category: str, likes: int = 0):
    """Update brand mention statistics."""
    conn = get_db()
    try:
        existing = conn.execute("SELECT * FROM brand_mentions WHERE brand = ?", (brand,)).fetchone()
        if existing:
            new_count = existing["mention_count"] + 1
            new_avg = (existing["avg_likes"] * existing["mention_count"] + likes) / new_count
            conn.execute("""
                UPDATE brand_mentions SET
                    mention_count = ?, wealthy_user_count = wealthy_user_count + 1,
                    avg_likes = ?, updated_at = ?
                WHERE brand = ?
            """, (new_count, new_avg, datetime.now().isoformat(), brand))
        else:
            conn.execute("""
                INSERT INTO brand_mentions (brand, category, mention_count, wealthy_user_count, avg_likes, updated_at)
                VALUES (?, ?, 1, 1, ?, ?)
            """, (brand, category, likes, datetime.now().isoformat()))
        conn.commit()
    finally:
        conn.close()


async def run_scrape_job(job_id: int, keywords: List[str] = None, max_users: int = 50):
    """
    Main scraping pipeline:
    1. Search for wealth-signal posts
    2. Identify wealthy users
    3. Get their following lists and post details
    4. Update all statistics
    """
    if keywords is None:
        keywords = WEALTH_SEARCH_KEYWORDS

    conn = get_db()
    conn.execute("""
        UPDATE scrape_jobs SET status='running', started_at=?, total=?
        WHERE id=?
    """, (datetime.now().isoformat(), len(keywords), job_id))
    conn.commit()
    conn.close()

    async with async_playwright() as p:
        browser, context = await create_browser_context(p)
        page = await context.new_page()

        # Check if logged in
        await page.goto(f"{XHS_BASE}/explore")
        await random_delay(2, 3)

        wealthy_users_found = set()
        processed_posts = set()

        for idx, keyword in enumerate(keywords):
            try:
                # Update job progress
                conn = get_db()
                conn.execute("""
                    UPDATE scrape_jobs SET progress=?, message=?
                    WHERE id=?
                """, (idx, f"搜索关键词: {keyword}", job_id))
                conn.commit()
                conn.close()

                # Search posts
                posts = await search_posts(page, keyword, max_posts=20)
                print(f"Found {len(posts)} posts for '{keyword}'")

                for post in posts:
                    if post["id"] in processed_posts:
                        continue
                    processed_posts.add(post["id"])

                    # Get post details
                    if post.get("url"):
                        detail = await get_post_detail(page, post["url"])
                        if detail:
                            post.update(detail)
                            await random_delay(1, 2)

                    # Evaluate wealth signals
                    text = f"{post.get('title', '')} {post.get('content', '')}"
                    score, signals = calculate_wealth_score(text)

                    # Also check comments
                    comment_texts = [c.get("content", "") for c in post.get("comments", [])]
                    for ct in comment_texts:
                        cs, css = calculate_wealth_score(ct)
                        if cs > 0:
                            score += cs * 0.3
                            signals.extend(css)

                    if score >= 15 and post.get("author_id"):
                        user_id = post["author_id"]

                        if user_id not in wealthy_users_found and len(wealthy_users_found) < max_users:
                            wealthy_users_found.add(user_id)

                            # Get full user profile
                            profile = await get_user_profile(page, user_id)
                            if profile:
                                user_data = {**post, **profile}
                                save_wealthy_user(user_data, score, list(set(signals)))
                                print(f"Saved wealthy user: {post.get('author_name')} (score: {score:.1f})")

                                # Get their following list
                                following = await get_user_following(page, user_id)
                                if following:
                                    save_following(user_id, following)
                                    print(f"  -> Saved {len(following)} followed accounts")

                                await random_delay(2, 4)

                    # Save post
                    hashtags = post.get("hashtags", [])
                    save_post(post, post.get("author_id", ""), hashtags, score >= 15)

                    # Update hashtag stats
                    for tag in hashtags:
                        update_hashtag_stats(tag, likes=post.get("likes", 0))

                    # Update brand stats
                    brands = detect_brands_in_text(text)
                    for b in brands:
                        update_brand_stats(b["brand"], b["category"], post.get("likes", 0))

                await random_delay(3, 5)

            except Exception as e:
                print(f"Error processing keyword '{keyword}': {e}")
                continue

        await browser.close()

    # Mark job complete
    conn = get_db()
    conn.execute("""
        UPDATE scrape_jobs SET status='completed', progress=?, message=?, finished_at=?
        WHERE id=?
    """, (len(keywords), f"完成！找到 {len(wealthy_users_found)} 位有钱人", datetime.now().isoformat(), job_id))
    conn.commit()
    conn.close()

    return {"wealthy_users_found": len(wealthy_users_found), "posts_processed": len(processed_posts)}
