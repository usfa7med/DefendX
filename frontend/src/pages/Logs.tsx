import { ChevronDown, Download, Filter, Globe, Search, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { RequestLog, PaginatedResponse } from "../types";
import Pagination from "../components/Pagination";
import LogDetailModal from "../components/LogDetailModal";
import { timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";

export default function Logs() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<RequestLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [ipFilter, setIpFilter] = useState(searchParams.get("ip") || "");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [actionOpen, setActionOpen] = useState(false);

  const actionDisplay = (val: string) =>
    val === "" ? "All"
    : val === "soft_rate_limit" ? "Rate Limit"
    : val === "temporary_ban" ? "Temp Ban"
    : val === "permanent_ban" ? "Perm Ban"
    : val.charAt(0).toUpperCase() + val.slice(1);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["ID", "Timestamp", "Method", "Path", "IP", "Country", "Status", "Action", "Risk Score", "User Agent"];
    const rows = data.data.map((log) => [
      log.id, log.timestamp, log.method, log.path, log.ip, log.country || "",
      String(log.statusCode ?? ""), log.actionTaken || "", String(log.riskScore ?? ""), `"${log.userAgent || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-logs-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (actionFilter) params.set("action", actionFilter);
    if (ipFilter) params.set("ip", ipFilter);
    api.get<PaginatedResponse<RequestLog>>(`/api/logs?${params}`)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load logs"))
      .finally(() => setLoading(false));
  }, [page, search, actionFilter, ipFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[75vh]">
        <div className="bg-surface-container rounded-xl p-8 max-w-sm text-center border border-error/20">
          <TriangleAlert className="w-9 h-9 text-error/70 mb-4 mx-auto" />
          <h3 className="text-sm font-headline font-extrabold uppercase tracking-wide text-on-surface">Failed to Load</h3>
          <p className="text-on-surface-variant text-[12px] font-mono mt-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary-container/10 text-primary rounded-lg text-[11px] font-mono hover:bg-primary-container/20 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  const methodColor = (m: string) => {
    const map: Record<string, string> = {
      GET: "text-primary bg-primary/10 border-primary/20",
      POST: "text-secondary bg-secondary/10 border-secondary/20",
      PUT: "text-tertiary bg-tertiary/10 border-tertiary/20",
      PATCH: "text-tertiary bg-tertiary/10 border-tertiary/20",
      DELETE: "text-error bg-error/10 border-error/20",
    };
    return map[m] || "text-on-surface-variant bg-surface-container border-outline-variant/50";
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-error" : s >= 60 ? "text-tertiary" : s >= 30 ? "text-primary" : s > 0 ? "text-on-surface-variant" : "text-primary";

  return (
    <div className="space-y-5">
      <LogDetailModal requestId={detailId} onClose={() => setDetailId(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Request Logs</h1>
          <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">Ingested request archive</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-colors",
              showFilters ? "border-primary/30 text-primary bg-primary/5" : "border-outline-variant/30 text-on-surface-variant bg-surface-container hover:bg-surface-container-high")}>
            <Filter className="w-3 h-3" /> Filters
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container text-[11px] font-mono text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="panel p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search paths..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
          </div>
          <input value={ipFilter} onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
            placeholder="Filter by IP"
            className="w-40 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
          <div className="relative">
            <button onClick={() => setActionOpen(!actionOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[11px] font-mono text-on-surface-variant hover:bg-surface-container-high transition-colors">
              {actionDisplay(actionFilter)} <ChevronDown className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xl z-10 overflow-hidden">
                {[{ v: "", l: "All" }, { v: "log", l: "Log" }, { v: "warning", l: "Warning" }, { v: "soft_rate_limit", l: "Rate Limit" }, { v: "temporary_ban", l: "Temp Ban" }, { v: "permanent_ban", l: "Perm Ban" }].map(({ v, l }) => (
                  <button key={v} onClick={() => { setActionFilter(v); setActionOpen(false); setPage(1); }}
                    className={cn("w-full px-3 py-2 text-[11px] font-mono text-left hover:bg-surface-container transition-colors",
                      actionFilter === v ? "text-primary bg-primary/5" : "text-on-surface-variant")}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default/40 bg-surface-0/30">
                {["Method", "Path", "IP", "Country", "Status", "Action", "Score", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16"><div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={8} className="text-center py-16 text-[11px] font-mono text-on-surface-variant/40">No logs found</td></tr>
              ) : data.data.map((log) => (
                <tr key={log.id} onClick={() => setDetailId(log.id)}
                  className="border-b border-outline-variant/10 hover:bg-surface-container/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border", methodColor(log.method))}>{log.method}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface max-w-[280px] truncate">{log.path}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface">{log.ip}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant">{log.country || ""}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface-variant">{log.statusCode ?? ""}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant">{log.actionTaken || ""}</td>
                  <td className={cn("px-4 py-3 text-[12px] font-mono font-bold", scoreColor(log.riskScore ?? 0))}>{log.riskScore ?? 0}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{timeAgo(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && (
        <Pagination page={page} pages={data.pagination.pages} total={data.pagination.total} label="logs" onPageChange={setPage} />
      )}
    </div>
  );
}
