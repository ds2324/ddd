# 有钱人灵感站 · 小红书财富洞察

追踪小红书有钱人关注的人、话题和品牌，发现高端消费趋势。

## 什么是「有钱人」？

通过以下信号识别：
- **主动炫富帖**：发帖晒名车（法拉利/兰博基尼/保时捷...）或名表（劳力士/百达翡丽/AP...）
- **评论炫资产**：在别人帖子下晒自己的豪车、名表、游艇等资产
- 系统给每位用户计算**财富指数**，≥20分认定为有钱人

## 功能页面

| 页面 | 功能 |
|------|------|
| 总览 | 核心数据图表，快速洞察 |
| 有钱人 | 浏览有钱用户列表，查看其关注和帖子 |
| 热门博主 | 被最多有钱人关注的 KOL |
| 热门话题 | 有钱人活跃的 hashtag 趋势 |
| 品牌趋势 | 有钱人最常提及的品牌和品类 |
| 热门帖子 | 财富相关热门内容 |
| 数据采集 | 控制爬虫 / 加载演示数据 |

## 快速开始

### 一键启动
```bash
./start.sh
```

### 手动启动

**后端（Python + FastAPI）**
```bash
cd backend
pip install -r requirements.txt
playwright install chromium  # 如需真实爬取
uvicorn main:app --reload
# API 文档: http://localhost:8000/docs
```

**前端（React + Vite）**
```bash
cd frontend
npm install
npm run dev
# 访问: http://localhost:3000
```

### 加载演示数据
1. 打开 http://localhost:3000
2. 进入「数据采集」页面
3. 点击「加载模拟数据」

### 真实数据采集（需要小红书账号）
1. 启动后端服务
2. 在「数据采集」页面配置关键词
3. 点击「开始采集」，浏览器会打开并等待登录
4. 手动登录小红书后，自动开始爬取

## 技术架构

```
backend/
├── main.py              # FastAPI 应用入口
├── models/
│   ├── database.py      # SQLite 数据库操作
│   └── schemas.py       # Pydantic 数据模型
├── api/
│   └── routes.py        # REST API 路由
└── scraper/
    ├── xhs_scraper.py   # Playwright 爬虫
    ├── wealth_detector.py # 有钱人识别算法
    └── mock_data.py     # 演示数据生成器

frontend/
└── src/
    ├── pages/           # 各功能页面组件
    └── api.ts           # API 调用封装
```

## 财富识别算法

| 信号类型 | 权重 |
|----------|------|
| 提及豪车品牌 | +15分 |
| 提及名表品牌 | +12分 |
| 奢华生活关键词 | +5分/个（上限20） |
| 炫富语句模式 | +20分 |
| 评论中的炫富信号 | ×0.3（折算） |

**阈值：财富指数 ≥ 20 → 认定为有钱人**
