import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hash, Flame } from "lucide-react";
import { fetchHashtags } from "../api";

const CATEGORY_COLORS: Record<string, string> = {
  汽车: "bg-red-500/10 text-red-300 border-red-500/20",
  腕表: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  奢侈品: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  生活方式: "bg-green-500/10 text-green-300 border-green-500/20",
  美食: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  房产: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  运动: "bg-teal-500/10 text-teal-300 border-teal-500/20",
};

function formatCount(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}千万`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
}

export default function Hashtags() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("trending_score");

  const { data, isLoading } = useQuery({
    queryKey: ["hashtags", category, sortBy],
    queryFn: () => fetchHashtags({ limit: 50, category, sort_by: sortBy }),
  });

  const hashtags = data?.hashtags ?? [];
  const categories = data?.categories ?? [];

  const maxScore = Math.max(...hashtags.map((h: any) => h.trending_score || 0), 1);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Hash size={18} className="text-purple-400" />
        <h1 className="text-xl font-bold">热门话题 / Hashtag</h1>
        <span className="text-sm text-gray-400">有钱人活跃的话题</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          全部
        </button>
        {categories.map((cat: string) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === category ? undefined : cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              category === cat
                ? CATEGORY_COLORS[cat] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                : "bg-gray-800 text-gray-400 border-transparent hover:text-gray-200"
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
            <option value="trending_score">综合热度</option>
            <option value="wealthy_user_count">有钱人数量</option>
            <option value="total_likes">总点赞数</option>
          </select>
        </div>
      </div>

      {/* Hashtag grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-800" />
          ))}
        </div>
      ) : hashtags.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">#</div>
          <div>暂无数据，请先加载数据</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hashtags.map((tag: any, idx: number) => {
            const barWidth = Math.round((tag.trending_score / maxScore) * 100);
            const catColor = CATEGORY_COLORS[tag.category] ?? "bg-gray-500/10 text-gray-300 border-gray-500/20";
            return (
              <div key={tag.tag} className="card relative overflow-hidden">
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-purple-500/5 rounded-xl"
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {idx < 3 && <Flame size={14} className="text-orange-400" />}
                      <span className="font-bold text-purple-300">#{tag.tag}</span>
                    </div>
                    {tag.category && (
                      <span className={`badge border text-xs ${catColor}`}>{tag.category}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-base font-bold text-white">
                        {tag.wealthy_user_count?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">有钱人</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        {formatCount(tag.total_likes)}
                      </div>
                      <div className="text-xs text-gray-400">总点赞</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
