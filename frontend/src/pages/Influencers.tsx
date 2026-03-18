import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ExternalLink } from "lucide-react";
import { fetchInfluencers } from "../api";

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n?.toLocaleString() ?? "0";
}

export default function Influencers() {
  const [page, setPage] = useState(0);
  const limit = 24;

  const { data, isLoading } = useQuery({
    queryKey: ["influencers", page],
    queryFn: () => fetchInfluencers({ limit, offset: page * limit }),
  });

  const influencers = data?.influencers ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-green-400" />
        <h1 className="text-xl font-bold">有钱人最爱关注的博主</h1>
        <span className="text-sm text-gray-400">共 {total} 位</span>
      </div>

      <div className="card bg-gray-900/50 border-gray-800/50 text-sm text-gray-400 flex items-center gap-2">
        <span className="text-yellow-400">💡</span>
        这些博主被最多有钱人关注，是获取高端消费趋势的重要来源
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse h-36 bg-gray-800" />
          ))}
        </div>
      ) : influencers.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">👥</div>
          <div>暂无数据，请先加载数据</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {influencers.map((inf: any, idx: number) => (
            <div key={inf.id} className="card hover:border-gray-600 transition-colors relative">
              {/* Rank badge */}
              {idx < 3 && (
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  idx === 0 ? "bg-yellow-500 text-yellow-900"
                  : idx === 1 ? "bg-gray-300 text-gray-900"
                  : "bg-amber-600 text-amber-100"
                }`}>
                  {idx + 1}
                </div>
              )}

              <div className="flex flex-col items-center text-center gap-3">
                <img
                  src={inf.avatar || `https://picsum.photos/seed/${inf.id}/64/64`}
                  alt={inf.nickname}
                  className="w-16 h-16 rounded-full object-cover bg-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${inf.id}/64/64`; }}
                />
                <div>
                  <div className="font-semibold text-sm">{inf.nickname}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatCount(inf.followers)} 粉丝
                  </div>
                </div>

                <div className="w-full grid grid-cols-1 gap-1">
                  <div className="bg-green-500/10 text-green-300 rounded-lg py-1.5 text-center">
                    <div className="text-base font-bold">{inf.wealthy_followers}</div>
                    <div className="text-xs">有钱人关注</div>
                  </div>
                </div>

                {inf.profile_url && (
                  <a
                    href={inf.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink size={10} />
                    查看主页
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary disabled:opacity-50 text-sm"
          >
            上一页
          </button>
          <span className="text-sm text-gray-400">
            第 {page + 1} / {Math.ceil(total / limit)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * limit >= total}
            className="btn-secondary disabled:opacity-50 text-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
