"""
Wealth signal detection - identifies wealthy users on XHS based on:
1. Posts showing luxury cars (名车)
2. Posts showing luxury watches (名表)
3. Comments/replies showing off assets
"""

import re
from typing import List, Tuple

# Luxury car brands
LUXURY_CAR_BRANDS = [
    "法拉利", "Ferrari", "兰博基尼", "Lamborghini", "保时捷", "Porsche",
    "宾利", "Bentley", "劳斯莱斯", "Rolls-Royce", "迈巴赫", "Maybach",
    "阿斯顿马丁", "Aston Martin", "麦克拉伦", "McLaren", "布加迪", "Bugatti",
    "玛莎拉蒂", "Maserati", "阿尔法罗密欧", "奥迪R8", "宝马M", "奔驰AMG",
    "GT3", "GT4", "卡宴", "Cayenne", "帕拉梅拉", "Panamera",
    "豪车", "名车", "跑车", "超跑", "限量版车",
]

# Luxury watch brands
LUXURY_WATCH_BRANDS = [
    "劳力士", "Rolex", "百达翡丽", "Patek Philippe", "爱彼", "Audemars Piguet",
    "AP", "朗格", "A. Lange", "宝珀", "Blancpain", "积家", "Jaeger",
    "万国", "IWC", "百年灵", "Breitling", "欧米茄", "Omega",
    "名表", "腕表", "手表收藏", "表界", "PP", "RM", "Richard Mille",
    "卡地亚", "Cartier", "萧邦", "Chopard", "伯爵", "Piaget",
]

# Luxury lifestyle keywords
LUXURY_LIFESTYLE = [
    "私人飞机", "公务机", "游艇", "豪宅", "别墅", "高尔夫球场",
    "米其林", "顶级餐厅", "头等舱", "商务舱", "私人订制",
    "爱马仕", "Hermès", "LV", "Louis Vuitton", "Chanel", "香奈儿",
    "Dior", "迪奥", "Gucci", "古驰", "Prada", "普拉达",
    "豪华", "奢华", "顶奢", "轻奢",
]

# Wealth show-off patterns in posts/comments
WEALTH_SHOWOFF_PATTERNS = [
    r"我的[法兰宾劳迈阿麦布玛保]",  # "我的法拉利" etc
    r"刚入手.*?[车表包]",
    r"新买的.*?[车表包]",
    r"(年薪|月入|身价|资产|净资产).*?[万亿百千]",
    r"[千百]万.*?(车|别墅|豪宅)",
    r"晒.*?(名车|名表|豪车|跑车)",
    r"提车.*?(法拉利|兰博|保时捷|宾利|劳斯莱斯)",
    r"(入手|收藏|新添).*?(劳力士|百达翡丽|爱彼|AP|PP|RM)",
]

# Category mapping
BRAND_CATEGORIES = {
    "汽车": LUXURY_CAR_BRANDS,
    "腕表": LUXURY_WATCH_BRANDS,
    "生活方式": LUXURY_LIFESTYLE,
}


def calculate_wealth_score(text: str) -> Tuple[float, List[str]]:
    """
    Calculate wealth score and extract signals from text.
    Returns (score, signals_list)
    """
    text_lower = text.lower()
    score = 0.0
    signals = []

    # Check luxury car mentions
    for brand in LUXURY_CAR_BRANDS:
        if brand.lower() in text_lower:
            score += 15
            signals.append(f"提及豪车: {brand}")
            break

    # Check luxury watch mentions
    for brand in LUXURY_WATCH_BRANDS:
        if brand.lower() in text_lower:
            score += 12
            signals.append(f"提及名表: {brand}")
            break

    # Check luxury lifestyle
    lifestyle_count = 0
    for keyword in LUXURY_LIFESTYLE:
        if keyword.lower() in text_lower:
            lifestyle_count += 1
            if lifestyle_count == 1:
                signals.append(f"奢华生活方式")
    score += min(lifestyle_count * 5, 20)

    # Check wealth show-off patterns
    for pattern in WEALTH_SHOWOFF_PATTERNS:
        if re.search(pattern, text):
            score += 20
            signals.append("炫富内容")
            break

    return score, signals


def is_wealthy_user(posts: List[dict], comments: List[dict] = None) -> Tuple[bool, float, List[str]]:
    """
    Determine if a user is wealthy based on their posts and comments.
    Returns (is_wealthy, score, signals)
    """
    total_score = 0.0
    all_signals = []

    for post in posts:
        text = f"{post.get('title', '')} {post.get('content', '')}"
        score, signals = calculate_wealth_score(text)
        total_score += score
        all_signals.extend(signals)

    if comments:
        for comment in comments:
            text = comment.get("content", "")
            score, signals = calculate_wealth_score(text)
            total_score += score * 0.5  # Comments weighted less
            all_signals.extend(signals)

    # Deduplicate signals
    all_signals = list(set(all_signals))

    # Threshold: score >= 20 means wealthy
    is_wealthy = total_score >= 20

    return is_wealthy, total_score, all_signals


def detect_brands_in_text(text: str) -> List[dict]:
    """Extract brand mentions with categories from text."""
    found = []
    text_lower = text.lower()

    for category, brands in BRAND_CATEGORIES.items():
        for brand in brands:
            if brand.lower() in text_lower:
                found.append({"brand": brand, "category": category})

    return found


def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from XHS post text."""
    # XHS uses #tag# or #tag format
    patterns = [
        r'#([^#\s]+)#',  # #tag#
        r'#([^#\s]+)',    # #tag
    ]
    tags = []
    for pattern in patterns:
        tags.extend(re.findall(pattern, text))
    return list(set(tags))


# Keywords to search for wealthy users
WEALTH_SEARCH_KEYWORDS = [
    "晒车 法拉利",
    "晒车 兰博基尼",
    "晒车 保时捷",
    "晒表 劳力士",
    "晒表 百达翡丽",
    "超跑 提车",
    "名表 收藏",
    "豪车 日常",
    "私人飞机 出行",
    "游艇 生活",
    "豪宅 分享",
    "顶奢 开箱",
]
