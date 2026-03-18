import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { fetchBrands } from "../api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  汽车: "#ef4444",
  腕表: "#3b82f6",
  奢侈品: "#8b5cf6",
  生活方式: "#10b981",
  美食: "#f97316",
  房产: "#eab308",
  运动: "#14b8a6",
};

const PIE_COLORS = ["#ef4444", "#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#eab308", "#14b8a6", "#ec4899"];

function formatLikes(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n?.toLocaleString() ?? "0";
}

export default function Brands() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("wealthy_user_count");

  const { data, isLoading } = useQuery({
    queryKey: ["brands", category, sortBy],
    queryFn: () => fetchBrands({ limit: 30, category, sort_by: sortBy }),
  });

  const brands = data?.brands ?? [];
  const categories = data?.categories ?? [];

  // Aggregate by category for pie chart
  const pieData = categories.map((cat: string) => ({
    name: cat,
    value: brands
      .filter((b: any) => b.category === cat)
      .reduce((sum: number, b: any) => sum + b.mention_count, 0),
  })).filter((d: any) => d.value > 0);

  const maxMentions = Math.max(...brands.map((b: any) => b.mention_count || 0), 1);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ShoppingBag size={18} className="text-gold-400" />
        <h1 className="text-xl font-bold">品牌趋势</h1>
        <span className="text-sm text-gray-400">有钱人最常提及的品牌</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="card xl:col-span-1">
          <h2 className="font-semibold mb-3 text-sm text-gray-300">品类分布</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {pieData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                  formatter={(v: any) => [v.toLocaleString(), "提及次数"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">暂无数据</div>
          )}
        </div>

        {/* Brand List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategory(undefined)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !category ? "bg-gold-500/20 text-gold-300 border border-gold-500/30" : "bg-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              全部
            </button>
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? undefined : cat)}
                style={category === cat ? { background: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat] } : {}}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat ? "border" : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-1.5 text-gray-200"
              >
                <option value="wealthy_user_count">有钱人数量</option>
                <option value="mention_count">总提及次数</option>
                <option value="avg_likes">平均点赞</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="card animate-pulse h-14 bg-gray-800" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <div className="card text-center py-10 text-gray-500">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {brands.map((brand: any, idx: number) => {
                const barW = Math.round((brand.mention_count / maxMentions) * 100);
                const color = CATEGORY_COLORS[brand.category] ?? "#6b7280";
                return (
                  <div key={brand.id ?? idx} className="card relative overflow-hidden py-3 px-4">
                    <div
                      className="absolute inset-y-0 left-0 opacity-10 rounded-xl"
                      style={{ width: `${barW}%`, background: color }}
                    />
                    <div className="relative flex items-center gap-3">
                      <div className="text-lg font-bold text-gray-400 w-6 text-right text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{brand.brand}</span>
                          <span
                            className="badge text-xs"
                            style={{ background: `${color}20`, color }}
                          >
                            {brand.category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {brand.wealthy_user_count} 位有钱人提及 · 平均 {formatLikes(brand.avg_likes)} 赞
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold">{brand.mention_count?.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">次提及</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
