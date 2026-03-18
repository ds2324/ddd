import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Play, Database, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { fetchJobs, startScrape, seedMockData } from "../api";

const KEYWORD_PRESETS = [
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
];

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-500/20 text-green-300",
    running: "bg-blue-500/20 text-blue-300 animate-pulse",
    failed: "bg-red-500/20 text-red-300",
    pending: "bg-gray-500/20 text-gray-300",
  };
  const icons: Record<string, any> = {
    completed: CheckCircle,
    running: RefreshCw,
    failed: AlertCircle,
    pending: Clock,
  };
  const Icon = icons[status] ?? Clock;
  return (
    <span className={`badge ${styles[status] ?? "bg-gray-500/20 text-gray-300"} flex items-center gap-1`}>
      <Icon size={10} />
      {status}
    </span>
  );
}

export default function ScraperControl() {
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState<string[]>(KEYWORD_PRESETS.slice(0, 5));
  const [maxUsers, setMaxUsers] = useState(50);
  const [customKeyword, setCustomKeyword] = useState("");

  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    refetchInterval: 5000,
  });

  const scrapeMutation = useMutation({
    mutationFn: startScrape,
    onSuccess: () => {
      setTimeout(() => refetchJobs(), 1000);
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedMockData,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const toggleKeyword = (kw: string) => {
    setKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const addCustom = () => {
    if (customKeyword.trim() && !keywords.includes(customKeyword.trim())) {
      setKeywords((prev) => [...prev, customKeyword.trim()]);
      setCustomKeyword("");
    }
  };

  const jobs = jobsData?.jobs ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-gray-400" />
        <h1 className="text-xl font-bold">数据采集控制台</h1>
      </div>

      {/* Demo Mode */}
      <div className="card border-gold-500/20 bg-gold-500/5">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-gold-300">演示模式 - 加载模拟数据</div>
            <div className="text-sm text-gray-400 mt-1">
              无需小红书账号，直接加载模拟的有钱人数据来体验网站功能。
              数据包含10位有钱用户、20个热门话题、12个品牌趋势。
            </div>
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="mt-3 btn-primary flex items-center gap-2 text-sm"
            >
              {seedMutation.isPending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              {seedMutation.isPending ? "加载中..." : "加载模拟数据"}
            </button>
            {seedMutation.isSuccess && (
              <div className="mt-2 text-sm text-green-400 flex items-center gap-1">
                <CheckCircle size={13} />
                模拟数据加载成功！请刷新各页面查看。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Scraper */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Play size={16} className="text-xhs-red" />
          <h2 className="font-semibold">真实数据采集</h2>
          <span className="badge bg-red-500/10 text-red-300 text-xs">需要小红书账号</span>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-400 space-y-1">
            <div className="font-medium text-gray-300 mb-1">使用说明：</div>
            <div>1. 确保已安装依赖：<code className="bg-gray-700 px-1 rounded">pip install -r requirements.txt && playwright install chromium</code></div>
            <div>2. 启动后端：<code className="bg-gray-700 px-1 rounded">cd backend && uvicorn main:app --reload</code></div>
            <div>3. 浏览器会自动打开，手动登录小红书</div>
            <div>4. 登录后点击「开始采集」，系统自动找有钱人</div>
          </div>

          {/* Keywords */}
          <div>
            <div className="text-sm font-medium text-gray-300 mb-2">搜索关键词（选择要搜索的财富相关词）</div>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_PRESETS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    keywords.includes(kw)
                      ? "bg-xhs-red/20 text-xhs-red border border-xhs-red/30"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="添加自定义关键词..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-2 text-gray-200 placeholder-gray-500"
              />
              <button onClick={addCustom} className="btn-secondary text-sm">添加</button>
            </div>
          </div>

          {/* Max Users */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300 w-28 flex-shrink-0">
              最多采集用户数
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={maxUsers}
              onChange={(e) => setMaxUsers(Number(e.target.value))}
              className="flex-1 accent-xhs-red"
            />
            <span className="text-sm font-bold text-xhs-red w-12 text-right">{maxUsers}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrapeMutation.mutate({ keywords, max_users: maxUsers })}
              disabled={scrapeMutation.isPending || keywords.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} />
              {scrapeMutation.isPending ? "启动中..." : "开始采集"}
            </button>
            <span className="text-xs text-gray-500">
              将搜索 {keywords.length} 个关键词，最多找 {maxUsers} 位有钱人
            </span>
          </div>
        </div>
      </div>

      {/* Jobs History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />
            采集任务历史
          </h2>
          <button
            onClick={() => refetchJobs()}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">暂无采集任务</div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job: any) => (
              <div key={job.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">任务 #{job.id}</span>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{job.message}</div>
                  {job.status === "running" && job.total > 0 && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>进度</span>
                        <span>{job.progress}/{job.total}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-xhs-red rounded-full transition-all"
                          style={{ width: `${Math.round((job.progress / job.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                  <div>{new Date(job.created_at).toLocaleDateString("zh-CN")}</div>
                  <div>{new Date(job.created_at).toLocaleTimeString("zh-CN")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
