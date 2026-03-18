import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "../data/xhs_wealth.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS wealthy_users (
            id TEXT PRIMARY KEY,
            nickname TEXT,
            avatar TEXT,
            bio TEXT,
            followers INTEGER DEFAULT 0,
            following INTEGER DEFAULT 0,
            wealth_score REAL DEFAULT 0,
            wealth_signals TEXT,
            profile_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            content TEXT,
            images TEXT,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            hashtags TEXT,
            url TEXT,
            wealth_related INTEGER DEFAULT 0,
            created_at TEXT,
            scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES wealthy_users(id)
        );

        CREATE TABLE IF NOT EXISTS followed_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wealthy_user_id TEXT,
            followed_user_id TEXT,
            followed_nickname TEXT,
            followed_avatar TEXT,
            followed_followers INTEGER DEFAULT 0,
            followed_bio TEXT,
            followed_url TEXT,
            follow_count INTEGER DEFAULT 1,
            FOREIGN KEY (wealthy_user_id) REFERENCES wealthy_users(id)
        );

        CREATE TABLE IF NOT EXISTS hashtags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT UNIQUE,
            post_count INTEGER DEFAULT 0,
            wealthy_user_count INTEGER DEFAULT 0,
            total_likes INTEGER DEFAULT 0,
            category TEXT,
            trending_score REAL DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS brand_mentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT,
            category TEXT,
            mention_count INTEGER DEFAULT 0,
            wealthy_user_count INTEGER DEFAULT 0,
            avg_likes REAL DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scrape_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_type TEXT,
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0,
            message TEXT,
            started_at TEXT,
            finished_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    conn.close()
