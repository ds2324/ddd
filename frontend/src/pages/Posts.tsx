import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { fetchPosts } from "../api";

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n?.toLocaleString() ?? "0";
}

export default function Posts() {
  const [page, setPage] = useState(0);
  const [wealthOnly, setWealthOnly] = useState(true);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["posts", page, wealthOnly],
    queryFn: () => fetchPosts({ limit, offset: page * limit, wealth_only: wealthOnly }),
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          <h1 className="text-xl font-bold">热门帖子</h1>
          <span className="text-sm text-gray-400">共 {total} 篇</span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={wealthOnly}
            onChange={(e) => { setWealthOnly(e.target.checked); setPage(0); }}
            className="w-4 h-4 accent-xhs-red"
          />
          <span className="text-gray-300">只看财富相关帖子</span>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-800" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <div>暂无帖子数据，请先加载数据</div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="card hover:border-gray-600 transition-colors">
              <div className="flex gap-3">
                {/* Author */}
                <div className="flex-shrink-0">
                  <img
                    src={post.author_avatar || `https://picsum.photos/seed/${post.user_id}/40/40`}
                    alt={post.author_nickname}
                    className="w-10 h-10 rounded-full object-cover bg-gray-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.user_id}/40/40`; }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm text-gray-400 mb-0.5">
                        {post.author_nickname || "匿名用户"}
                        {post.wealth_score && (
                          <span className="ml-2 text-gold-400 text-xs">财富指数 {post.wealth_score?.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="font-semibold text-base leading-tight">{post.title}</div>
                    </div>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {post.content && (
                    <div className="text-sm text-gray-400 mt-1 line-clamp-2">{post.content}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Heart size={13} className="text-xhs-red" />
                      {formatCount(post.likes)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MessageCircle size={13} className="text-blue-400" />
                      {formatCount(post.comments)}
                    </div>

                    {Array.isArray(post.hashtags) && post.hashtags.slice(0, 4).map((tag: string) => (
                      <span key={tag} className="text-xs text-purple-400">#{tag}</span>
                    ))}

                    {post.wealth_related === 1 && (
                      <span className="badge bg-xhs-red/10 text-xhs-red ml-auto">财富相关</span>
                    )}
                  </div>
                </div>
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
