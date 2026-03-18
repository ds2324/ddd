"""
Mock data generator for development/demo purposes.
Generates realistic-looking data for the inspiration site.
"""

import json
import random
from datetime import datetime, timedelta
from models.database import get_db

WEALTHY_USERS = [
    {"id": "u001", "nickname": "豪车生活家", "bio": "法拉利车主 | 劳力士收藏者 | 私人飞机出行", "followers": 125000, "following": 312},
    {"id": "u002", "nickname": "阿布的日常", "bio": "游艇 | 高尔夫 | 米其林三星控", "followers": 89000, "following": 201},
    {"id": "u003", "nickname": "名媛小圈子", "bio": "爱马仕橙盒收集者 | 顶奢生活分享", "followers": 234000, "following": 445},
    {"id": "u004", "nickname": "超跑控老王", "bio": "兰博基尼 Urus + 保时捷 GT3RS 车主", "followers": 67000, "following": 189},
    {"id": "u005", "nickname": "表界达人", "bio": "百达翡丽 | 积家 | AP皇橡 收藏", "followers": 156000, "following": 267},
    {"id": "u006", "nickname": "私人订制生活", "bio": "别墅 | 商务机 | 顶级酒庄", "followers": 92000, "following": 334},
    {"id": "u007", "nickname": "Luxury Daily", "bio": "Daily luxury life | LV | Chanel | Hermès", "followers": 178000, "following": 412},
    {"id": "u008", "nickname": "车表双修", "bio": "劳力士迪通拿 | 法拉利488 车主", "followers": 43000, "following": 156},
    {"id": "u009", "nickname": "游艇party", "bio": "游艇圈 | 私人飞机 | 高尔夫球场", "followers": 31000, "following": 98},
    {"id": "u010", "nickname": "顶奢开箱君", "bio": "顶级奢侈品开箱 | 限量版收藏", "followers": 267000, "following": 523},
]

FOLLOWED_ACCOUNTS = [
    {"id": "f001", "nickname": "超跑世界", "followers": 890000, "bio": "全球超跑资讯第一媒体"},
    {"id": "f002", "nickname": "名表汇", "followers": 456000, "bio": "顶级腕表鉴赏与资讯"},
    {"id": "f003", "nickname": "私人飞机俱乐部", "followers": 234000, "bio": "商务航空 | 公务机租赁"},
    {"id": "f004", "nickname": "高尔夫精英圈", "followers": 123000, "bio": "高净值人群高尔夫社群"},
    {"id": "f005", "nickname": "游艇生活家", "followers": 567000, "bio": "游艇文化与豪华生活方式"},
    {"id": "f006", "nickname": "红酒收藏家", "followers": 89000, "bio": "顶级酒庄 | 波尔多 | 勃艮第"},
    {"id": "f007", "nickname": "顶级别墅鉴赏", "followers": 345000, "bio": "豪宅 | 别墅 | 顶级地产"},
    {"id": "f008", "nickname": "Hermès橙盒子", "followers": 678000, "bio": "爱马仕收藏者社区"},
    {"id": "f009", "nickname": "限量球鞋殿堂", "followers": 234000, "bio": "AJ | NB联名 | 限量发售"},
    {"id": "f010", "nickname": "米其林探店家", "followers": 456000, "bio": "全球米其林三星餐厅探访"},
    {"id": "f011", "nickname": "法拉利中国", "followers": 1200000, "bio": "Ferrari Official China"},
    {"id": "f012", "nickname": "劳力士官方", "followers": 890000, "bio": "Rolex Official Account"},
    {"id": "f013", "nickname": "百达翡丽中文", "followers": 456000, "bio": "Patek Philippe China"},
    {"id": "f014", "nickname": "保时捷中国", "followers": 2100000, "bio": "Porsche China Official"},
    {"id": "f015", "nickname": "私人银行VIP", "followers": 67000, "bio": "高净值财富管理"},
]

HASHTAGS = [
    {"tag": "超跑日常", "category": "汽车", "wealthy_user_count": 87, "total_likes": 2340000},
    {"tag": "名表收藏", "category": "腕表", "wealthy_user_count": 134, "total_likes": 1890000},
    {"tag": "法拉利", "category": "汽车", "wealthy_user_count": 76, "total_likes": 3120000},
    {"tag": "劳力士", "category": "腕表", "wealthy_user_count": 156, "total_likes": 2780000},
    {"tag": "游艇生活", "category": "生活方式", "wealthy_user_count": 45, "total_likes": 890000},
    {"tag": "私人飞机", "category": "生活方式", "wealthy_user_count": 38, "total_likes": 1230000},
    {"tag": "百达翡丽", "category": "腕表", "wealthy_user_count": 89, "total_likes": 1560000},
    {"tag": "顶奢开箱", "category": "奢侈品", "wealthy_user_count": 201, "total_likes": 4560000},
    {"tag": "豪宅日常", "category": "房产", "wealthy_user_count": 67, "total_likes": 1780000},
    {"tag": "爱马仕", "category": "奢侈品", "wealthy_user_count": 178, "total_likes": 3890000},
    {"tag": "兰博基尼", "category": "汽车", "wealthy_user_count": 54, "total_likes": 2100000},
    {"tag": "保时捷", "category": "汽车", "wealthy_user_count": 123, "total_likes": 3450000},
    {"tag": "高尔夫", "category": "运动", "wealthy_user_count": 89, "total_likes": 890000},
    {"tag": "米其林三星", "category": "美食", "wealthy_user_count": 167, "total_likes": 2340000},
    {"tag": "AP皇橡", "category": "腕表", "wealthy_user_count": 78, "total_likes": 1230000},
    {"tag": "宾利", "category": "汽车", "wealthy_user_count": 43, "total_likes": 980000},
    {"tag": "香奈儿", "category": "奢侈品", "wealthy_user_count": 234, "total_likes": 5670000},
    {"tag": "私人定制", "category": "生活方式", "wealthy_user_count": 56, "total_likes": 1120000},
    {"tag": "顶级酒庄", "category": "美食", "wealthy_user_count": 34, "total_likes": 670000},
    {"tag": "豪车改装", "category": "汽车", "wealthy_user_count": 45, "total_likes": 1340000},
]

BRANDS = [
    {"brand": "法拉利", "category": "汽车", "mention_count": 342, "wealthy_user_count": 89, "avg_likes": 34500},
    {"brand": "劳力士", "category": "腕表", "mention_count": 567, "wealthy_user_count": 156, "avg_likes": 28900},
    {"brand": "爱马仕", "category": "奢侈品", "mention_count": 890, "wealthy_user_count": 234, "avg_likes": 45600},
    {"brand": "保时捷", "category": "汽车", "mention_count": 678, "wealthy_user_count": 178, "avg_likes": 31200},
    {"brand": "百达翡丽", "category": "腕表", "mention_count": 234, "wealthy_user_count": 67, "avg_likes": 23400},
    {"brand": "香奈儿", "category": "奢侈品", "mention_count": 1234, "wealthy_user_count": 345, "avg_likes": 52300},
    {"brand": "兰博基尼", "category": "汽车", "mention_count": 289, "wealthy_user_count": 78, "avg_likes": 41200},
    {"brand": "爱彼AP", "category": "腕表", "mention_count": 189, "wealthy_user_count": 56, "avg_likes": 19800},
    {"brand": "LV", "category": "奢侈品", "mention_count": 1567, "wealthy_user_count": 423, "avg_likes": 48900},
    {"brand": "宾利", "category": "汽车", "mention_count": 167, "wealthy_user_count": 45, "avg_likes": 27800},
    {"brand": "理查德米勒", "category": "腕表", "mention_count": 123, "wealthy_user_count": 34, "avg_likes": 15600},
    {"brand": "Dior", "category": "奢侈品", "mention_count": 890, "wealthy_user_count": 267, "avg_likes": 39800},
]

POSTS = [
    {
        "id": "p001", "user_id": "u001",
        "title": "法拉利SF90提车记 🏎️ 生命中最美好的一天",
        "content": "终于等到了！SF90 Stradale，全球限量！提车那一刻感动到哭...",
        "likes": 89000, "comments": 2340, "hashtags": ["法拉利", "超跑日常", "提车"],
        "wealth_related": 1,
    },
    {
        "id": "p002", "user_id": "u005",
        "title": "百达翡丽5711 vs 劳力士迪通拿，我的选择",
        "content": "最终入手了PP 5711，腕表之王名不虚传，做工无可挑剔...",
        "likes": 67000, "comments": 1890, "hashtags": ["百达翡丽", "劳力士", "名表收藏"],
        "wealth_related": 1,
    },
    {
        "id": "p003", "user_id": "u002",
        "title": "地中海游艇派对分享 🛥️",
        "content": "在戛纳的第7天，今晚游艇派对主题是夏日狂欢...",
        "likes": 45000, "comments": 1230, "hashtags": ["游艇生活", "戛纳", "私人派对"],
        "wealth_related": 1,
    },
    {
        "id": "p004", "user_id": "u003",
        "title": "爱马仕铂金包vs凯莉包 购买心得",
        "content": "终于把两个都收齐了，其实爱马仕的入手逻辑和大家想的不一样...",
        "likes": 123000, "comments": 4560, "hashtags": ["爱马仕", "顶奢开箱", "包包"],
        "wealth_related": 1,
    },
    {
        "id": "p005", "user_id": "u006",
        "title": "私人飞机出行体验 | 北京飞三亚只需3小时",
        "content": "第一次坐公务机，和商务舱的体验完全不同...",
        "likes": 56000, "comments": 2100, "hashtags": ["私人飞机", "公务机", "奢华出行"],
        "wealth_related": 1,
    },
]


def seed_mock_data():
    """Seed database with mock data for development."""
    conn = get_db()

    print("Seeding wealthy users...")
    for user in WEALTHY_USERS:
        wealth_signals = ["豪车相关", "名表收藏", "奢华生活方式"]
        conn.execute("""
            INSERT OR REPLACE INTO wealthy_users
            (id, nickname, bio, followers, following, wealth_score, wealth_signals, profile_url, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"], user["nickname"], user["bio"],
            user["followers"], user["following"],
            random.uniform(60, 95),
            json.dumps(wealth_signals[:random.randint(1, 3)], ensure_ascii=False),
            f"https://www.xiaohongshu.com/user/profile/{user['id']}",
            f"https://picsum.photos/seed/{user['id']}/100/100",
        ))

    print("Seeding followed accounts...")
    for user in WEALTHY_USERS[:5]:
        # Each wealthy user follows a random subset of accounts
        sample = random.sample(FOLLOWED_ACCOUNTS, min(8, len(FOLLOWED_ACCOUNTS)))
        for acc in sample:
            conn.execute("""
                INSERT OR IGNORE INTO followed_accounts
                (wealthy_user_id, followed_user_id, followed_nickname, followed_followers,
                 followed_url, followed_avatar, follow_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user["id"], acc["id"], acc["nickname"], acc["followers"],
                f"https://www.xiaohongshu.com/user/profile/{acc['id']}",
                f"https://picsum.photos/seed/{acc['id']}/100/100",
                random.randint(1, 5),
            ))

    print("Seeding hashtags...")
    for h in HASHTAGS:
        score = h["wealthy_user_count"] * 10 + h["total_likes"] * 0.0001
        conn.execute("""
            INSERT OR REPLACE INTO hashtags
            (tag, wealthy_user_count, total_likes, category, trending_score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            h["tag"], h["wealthy_user_count"], h["total_likes"],
            h["category"], score, datetime.now().isoformat()
        ))

    print("Seeding brands...")
    for b in BRANDS:
        conn.execute("""
            INSERT OR REPLACE INTO brand_mentions
            (brand, category, mention_count, wealthy_user_count, avg_likes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            b["brand"], b["category"], b["mention_count"],
            b["wealthy_user_count"], b["avg_likes"], datetime.now().isoformat()
        ))

    print("Seeding posts...")
    for post in POSTS:
        conn.execute("""
            INSERT OR REPLACE INTO posts
            (id, user_id, title, content, likes, comments, hashtags, wealth_related, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            post["id"], post["user_id"], post["title"], post["content"],
            post["likes"], post["comments"],
            json.dumps(post["hashtags"], ensure_ascii=False),
            post["wealth_related"],
            (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        ))

    conn.commit()
    conn.close()
    print("Mock data seeded successfully!")
