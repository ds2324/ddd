from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WealthyUser(BaseModel):
    id: str
    nickname: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    followers: int = 0
    following: int = 0
    wealth_score: float = 0
    wealth_signals: Optional[str] = None
    profile_url: Optional[str] = None


class Post(BaseModel):
    id: str
    user_id: str
    title: str
    content: Optional[str] = None
    images: Optional[str] = None
    likes: int = 0
    comments: int = 0
    shares: int = 0
    hashtags: Optional[str] = None
    url: Optional[str] = None
    wealth_related: int = 0
    created_at: Optional[str] = None


class FollowedAccount(BaseModel):
    followed_user_id: str
    followed_nickname: str
    followed_avatar: Optional[str] = None
    followed_followers: int = 0
    followed_bio: Optional[str] = None
    followed_url: Optional[str] = None
    follow_count: int = 1


class Hashtag(BaseModel):
    tag: str
    post_count: int = 0
    wealthy_user_count: int = 0
    total_likes: int = 0
    category: Optional[str] = None
    trending_score: float = 0


class BrandMention(BaseModel):
    brand: str
    category: str
    mention_count: int = 0
    wealthy_user_count: int = 0
    avg_likes: float = 0


class ScrapeRequest(BaseModel):
    keywords: Optional[List[str]] = None
    max_users: int = 50
    max_posts_per_user: int = 20


class ScrapeJob(BaseModel):
    id: int
    job_type: str
    status: str
    progress: int
    total: int
    message: Optional[str] = None
