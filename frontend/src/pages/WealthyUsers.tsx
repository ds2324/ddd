import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronRight, Star, ArrowUpDown } from "lucide-react";
import { fetchWealthyUsers, fetchWealthyUser } from "../api";

function WealthBadge({ score }: { score: number }) {
  const level =
    score >= 80 ? { label: "超级富豪", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" }
    : score >= 60 ? { label: "富豪", color: "bg-gold-500/20 text-gold-300 border-gold-500/30" }
    : { label: "高净值", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
  return (
    <span className={`badge border ${level.color}`}>{level.label}</span>
  );
}

function SignalTag({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    "提及豪车": "bg-red-500/10 text-red-300",
    "提及名表": "bg-blue-500/10 text-blue-300",
    "奢华生活方式": "bg-purple-500/10 text-purple-300",
    "炫富内容": "bg-gold-500/10 text-gold-300",
  };
  const color = Object.entries(colors).find(([k]) => signal.includes(k))?.[1] ?? "bg-gray-500/10 text-gray-300";
  return <span className={`badge ${color}`}>{signal}</span>;
}

function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["wealthy-user", userId],
    queryFn: () => fetchWealthyUser(userId),
  });

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card w-full max-w-2xl p-8 text-center text-gray-400">加载中...</div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || `https://picsum.photos/seed/${user.id}/60/60`}
              alt={user.nickname}
              className="w-14 h-14 rounded-full object-cover bg-gray-700"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${user.id}/60/60`; }}
            />
            <div>
              <div className="font-bold text-lg">{user.nickname}</div>
              <div className="text-sm text-gray-400">{user.bio}</div>
              <div className="flex gap-2 mt-1">
                <WealthBadge score={user.wealth_score} />
                <span className="text-xs text-gray-500">财富指数 {user.wealth_score?.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{user.followers?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">粉丝</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{user.following?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">关注</div>
          </div>
        </div>

        {user.wealth_signals?.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-300 mb-2">财富信号</div>
            <div className="flex flex-wrap gap-2">
              {user.wealth_signals.map((s: string, i: number) => (
                <SignalTag key={i} signal={s} />
              ))}
            </div>
          </div>
        )}

        {user.following?.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-300 mb-2">他/她关注的账号</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {user.following.map((f: any) => (
                <a
                  key={f.followed_user_id}
                  href={f.followed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-sm"
                >
                  <img
                    src={f.followed_avatar || `https://picsum.photos/seed/${f.followed_user_id}/32/32`}
                    className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"
                    alt={f.followed_nickname}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${f.followed_user_id}/32/32`; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{f.followed_nickname}</div>
                    <div className="text-xs text-gray-400">{f.followed_followers?.toLocaleString()} 粉丝</div>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {user.recent_posts?.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-300 mb-2">近期帖子</div>
            <div className="space-y-2">
              {user.recent_posts.map((p: any) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-sm"
                >
                  <div className="font-medium line-clamp-1">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.likes?.toLocaleString()} 赞 · {p.comments?.toLocaleString()} 评论
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WealthyUsers() {
  const [sortBy, setSortBy] = useState("wealth_score");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["wealthy-users", sortBy, page],
    queryFn: () => fetchWealthyUsers({ limit, offset: page * limit, sort_by: sortBy }),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-xhs-red" />
          <h1 className="text-xl font-bold">有钱人列表</h1>
          <span className="text-sm text-gray-400">共 {total} 人</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-1.5 text-gray-200"
          >
            <option value="wealth_score">按财富指数</option>
            <option value="followers">按粉丝数</option>
            <option value="updated_at">按更新时间</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse h-32 bg-gray-800" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <div>暂无数据，请先在「数据采集」页面加载数据</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user: any) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className="card cursor-pointer hover:border-gray-600 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <img
                  src={user.avatar || `https://picsum.photos/seed/${user.id}/48/48`}
                  alt={user.nickname}
                  className="w-12 h-12 rounded-full object-cover bg-gray-700 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${user.id}/48/48`; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold truncate">{user.nickname}</div>
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 flex-shrink-0 transition-colors" />
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{user.bio || "暂无简介"}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <WealthBadge score={user.wealth_score} />
                    <div className="flex items-center gap-1 text-xs text-gold-400">
                      <Star size={10} fill="currentColor" />
                      {user.wealth_score?.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-800">
                <div className="text-center">
                  <div className="text-sm font-semibold">{user.followers?.toLocaleString() ?? 0}</div>
                  <div className="text-xs text-gray-400">粉丝</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{user.following?.toLocaleString() ?? 0}</div>
                  <div className="text-xs text-gray-400">关注</div>
                </div>
              </div>

              {user.wealth_signals?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Array.isArray(user.wealth_signals) ? user.wealth_signals : []).slice(0, 2).map((s: string, i: number) => (
                    <SignalTag key={i} signal={s} />
                  ))}
                </div>
              )}
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
            第 {page + 1} 页 / 共 {Math.ceil(total / limit)} 页
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

      {selectedUser && (
        <UserDetail userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
