import { useState } from "react";
import { LayoutDashboard, Users, Hash, TrendingUp, ShoppingBag, FileText, Settings } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import WealthyUsers from "./pages/WealthyUsers";
import Hashtags from "./pages/Hashtags";
import Influencers from "./pages/Influencers";
import Brands from "./pages/Brands";
import Posts from "./pages/Posts";
import ScraperControl from "./pages/ScraperControl";

const NAV_ITEMS = [
  { id: "dashboard", label: "总览", icon: LayoutDashboard },
  { id: "users", label: "有钱人", icon: Users },
  { id: "influencers", label: "热门博主", icon: TrendingUp },
  { id: "hashtags", label: "热门话题", icon: Hash },
  { id: "brands", label: "品牌趋势", icon: ShoppingBag },
  { id: "posts", label: "热门帖子", icon: FileText },
  { id: "scraper", label: "数据采集", icon: Settings },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const PageComponent = {
    dashboard: Dashboard,
    users: WealthyUsers,
    influencers: Influencers,
    hashtags: Hashtags,
    brands: Brands,
    posts: Posts,
    scraper: ScraperControl,
  }[page] ?? Dashboard;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-xhs-red to-gold-500 flex items-center justify-center text-sm font-bold">
              ¥
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">有钱人灵感站</div>
              <div className="text-xs text-gray-400">小红书财富洞察</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === id
                  ? "bg-xhs-red/10 text-xhs-red border border-xhs-red/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 text-center">
            追踪有钱人的品味与趋势
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <PageComponent />
      </main>
    </div>
  );
}
