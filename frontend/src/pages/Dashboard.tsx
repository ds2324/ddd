import { useQuery } from "@tanstack/react-query";
import { Users, Hash, TrendingUp, ShoppingBag, FileText, Sparkles } from "lucide-react";
import { fetchStats, fetchHashtags, fetchInfluencers, fetchBrands } from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = ["#ff2442", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: hashtagData } = useQuery({
    queryKey: ["hashtags", "top10"],
    queryFn: () => fetchHashtags({ limit: 10, sort_by: "trending_score" }),
  });
  const { data: influencerData } = useQuery({
    queryKey: ["influencers", "top8"],
    queryFn: () => fetchInfluencers({ limit: 8 }),
  });
  const { data: brandData } = useQuery({
    queryKey: ["brands", "top6"],
    queryFn: () => fetchBrands({ limit: 6 }),
  });

  const topHashtags = hashtagData?.hashtags ?? [];
  const topInfluencers = influencerData?.influencers ?? [];
  const topBrands = brandData?.brands ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles size={20} className="text-gold-400" />
        <div>
          <h1 className="text-xl font-bold">小红书有钱人灵感总览</h1>
          <p className="text-sm text-gray-400">基于小红书富豪用户行为的趋势洞察</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="有钱用户" value={stats?.wealthy_users ?? 0} icon={Users} color="bg-xhs-red/10 text-xhs-red" />
        <StatCard label="分析帖子" value={stats?.posts_analyzed ?? 0} icon={FileText} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="热门话题" value={stats?.trending_hashtags ?? 0} icon={Hash} color="bg-purple-500/10 text-purple-400" />
        <StatCard label="品牌提及" value={stats?.brand_mentions ?? 0} icon={ShoppingBag} color="bg-gold-500/10 text-gold-400" />
        <StatCard label="追踪博主" value={stats?.tracked_influencers ?? 0} icon={TrendingUp} color="bg-green-500/10 text-green-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Hashtags Chart */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Hash size={16} className="text-purple-400" />
            有钱人热门话题 Top 10
          </h2>
          {topHashtags.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topHashtags} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis
                  dataKey="tag"
                  type="category"
                  width={90}
                  tick={{ fontSize: 11, fill: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                  labelStyle={{ color: "#f9fafb" }}
                  formatter={(v: any) => [v.toLocaleString(), "有钱人数"]}
                />
                <Bar dataKey="wealthy_user_count" radius={[0, 4, 4, 0]}>
                  {topHashtags.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Top Brands Chart */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-gold-400" />
            有钱人热门品牌 Top 6
          </h2>
          {topBrands.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topBrands} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis
                  dataKey="brand"
                  type="category"
                  width={80}
                  tick={{ fontSize: 11, fill: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                  formatter={(v: any) => [v.toLocaleString(), "提及次数"]}
                />
                <Bar dataKey="mention_count" radius={[0, 4, 4, 0]}>
                  {topBrands.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Top Influencers */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" />
          有钱人最爱关注的博主
        </h2>
        {topInfluencers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topInfluencers.map((inf: any) => (
              <a
                key={inf.id}
                href={inf.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                <img
                  src={inf.avatar || `https://picsum.photos/seed/${inf.id}/40/40`}
                  alt={inf.nickname}
                  className="w-10 h-10 rounded-full object-cover bg-gray-700 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${inf.id}/40/40`; }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{inf.nickname}</div>
                  <div className="text-xs text-gray-400">
                    {inf.wealthy_followers} 位有钱人关注
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
      <div className="text-4xl mb-2">📭</div>
      <div className="text-sm">暂无数据，请先在「数据采集」页面加载数据</div>
    </div>
  );
}
