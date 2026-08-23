import { useEffect, useState, useRef, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Ban, Bug, ChevronDown, Download, Globe, Radar, RefreshCw, TrendingUp, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { DashboardData, Detection, PaginatedResponse } from "../types";
import { timeAgo, formatNumber } from "../lib/utils";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchDashboard = useCallback((period: string) => {
    setLoading(true);
    setError(null);
    return Promise.all([
      api.get<DashboardData>(`/api/stats/dashboard?period=${encodeURIComponent(period)}`),
      api.get<PaginatedResponse<Detection>>(`/api/detections?limit=8`),
    ])
      .then(([dash, det]) => {
        setData(dash);
        setRecentDetections(det.data);
      })
      .catch((err) => setError(err.message || "Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [timeRangeLabel, setTimeRangeLabel] = useState("Last Hour");
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);

  useEffect(() => {
    fetchDashboard("1h");
  }, [fetchDashboard]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const p = timeRangeLabel === "Last Hour" ? "1h" : timeRangeLabel === "Last 7 Days" ? "7d" : "24h";
    fetchDashboard(p).finally(() => setRefreshing(false));
  }, [fetchDashboard, timeRangeLabel]);

  const handleExport = useCallback(() => {
    if (!data) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: data.summary,
      topAttacks: data.top_attacks,
      topIps: data.top_ips,
      actionDistribution: data.action_distribution,
      hourlyTraffic: data.hourly_traffic,
      recentDetections,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-waf-export-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, recentDetections]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[75vh]">
        <div className="bg-surface-container rounded-xl p-8 max-w-sm text-center border border-error/20">
          <TriangleAlert className="w-9 h-9 text-error/70 mb-4 mx-auto" />
          <h3 className="text-sm font-headline font-extrabold uppercase tracking-wide text-on-surface">Connection Lost</h3>
          <p className="text-on-surface-variant text-[12px] font-mono mt-2">{error}</p>
          <button onClick={() => fetchDashboard("1h")} className="mt-4 px-4 py-2 bg-primary-container/10 text-primary rounded-lg text-[11px] font-mono hover:bg-primary-container/20 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[130px] panel rounded-xl bg-surface-container/50" />)}
        </div>
        <div className="h-[300px] panel rounded-xl bg-surface-container/50" />
      </div>
    );
  }

  const chartData = data?.hourly_traffic?.map((h) => ({
    time: h.hour?.slice(11, 16) || h.hour,
    total: h.total,
    malicious: h.malicious,
  })) || [];

  const severityColor = (s: string) =>
    s === "critical" ? "text-red" : s === "high" ? "text-tertiary" : s === "medium" ? "text-amber" : "text-on-surface-variant";

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Security Overview</h1>
          <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">Real-time threat monitoring dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setTimeRangeOpen(!timeRangeOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container text-[11px] font-mono text-on-surface-variant hover:bg-surface-container-high transition-colors">
              {timeRangeLabel} <ChevronDown className="w-3 h-3" />
            </button>
            {timeRangeOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xl z-10 overflow-hidden">
                {["Last Hour", "Last 24 Hours", "Last 7 Days"].map((label) => (
                  <button key={label} onClick={() => { setTimeRangeLabel(label); setTimeRangeOpen(false); fetchDashboard(label === "Last Hour" ? "1h" : label === "Last 7 Days" ? "7d" : "24h"); }}
                    className={cn("w-full px-3 py-2 text-[11px] font-mono text-left hover:bg-surface-container transition-colors",
                      timeRangeLabel === label ? "text-primary bg-primary/5" : "text-on-surface-variant")}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </button>
          <button onClick={handleExport}
            className="p-2 rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel p-4">
          <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Total Requests</p>
          <p className="text-2xl font-headline font-extrabold text-on-surface mt-1">{formatNumber(data?.summary?.total_requests ?? 0)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Detections</p>
          <p className="text-2xl font-headline font-extrabold text-tertiary mt-1">{formatNumber(data?.summary?.detections_count ?? 0)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Blocked</p>
          <p className="text-2xl font-headline font-extrabold text-error mt-1">{formatNumber(data?.summary?.blocked_count ?? 0)}</p>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-[11px] font-mono text-on-surface-variant/60 uppercase tracking-wider mb-4">Traffic &amp; Threats</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="malicious" stroke="#ef4444" fillOpacity={1} fill="url(#colorMalicious)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-on-surface-variant/30 text-[11px] font-mono">No traffic data</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Top Offending IPs</h3>
            <Link to="/blocked" className="text-[10px] font-mono text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {(!data?.top_ips || data.top_ips.length === 0) ? (
              <p className="text-[11px] font-mono text-on-surface-variant/30 text-center py-6">No data</p>
            ) : data.top_ips.map((ip) => (
              <div key={ip.ip} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
                <span className="text-[12px] font-mono text-on-surface">{ip.ip}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-on-surface-variant">{ip.count} reqs</span>
                  <span className={cn("text-[10px] font-mono font-bold", ip.max_score >= 80 ? "text-red" : ip.max_score >= 40 ? "text-amber" : "text-on-surface-variant")}>{ip.max_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Top Attack Types</h3>
            <Link to="/detections" className="text-[10px] font-mono text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {(!data?.top_attacks || data.top_attacks.length === 0) ? (
              <p className="text-[11px] font-mono text-on-surface-variant/30 text-center py-6">No data</p>
            ) : data.top_attacks.map((atk) => (
              <div key={atk.name} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
                <span className="text-[12px] font-mono text-on-surface truncate">{atk.name}</span>
                <span className="text-[10px] font-mono text-on-surface-variant shrink-0 ml-2">{atk.count} hits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Recent Detections</h3>
          <Link to="/detections" className="text-[10px] font-mono text-primary hover:underline">View All</Link>
        </div>
        {recentDetections.length === 0 ? (
          <p className="text-[11px] font-mono text-on-surface-variant/30 text-center py-6">No recent detections</p>
        ) : (
          <div className="space-y-2">
            {recentDetections.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-outline-variant/10 last:border-0">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                  d.severity === "critical" ? "bg-red" : d.severity === "high" ? "bg-tertiary" : d.severity === "medium" ? "bg-amber" : "bg-on-surface-variant/30"
                )} />
                <span className="text-[12px] font-mono text-on-surface truncate flex-1">{d.detectorName}</span>
                <span className={cn("text-[10px] font-mono uppercase", severityColor(d.severity))}>{d.severity}</span>
                <span className="text-[10px] font-mono text-on-surface-variant">{d.requestIp}</span>
                <span className="text-[10px] font-mono text-on-surface-variant/50">{timeAgo(d.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
