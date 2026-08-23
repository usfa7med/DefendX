import { ChevronDown, Search, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DetectionListEntry, PaginatedResponse } from "../types";
import Pagination from "../components/Pagination";
import { timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";

export default function Detections() {
  const [data, setData] = useState<PaginatedResponse<DetectionListEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [countCrit, setCountCrit] = useState(0);
  const [countHigh, setCountHigh] = useState(0);
  const [countMed, setCountMed] = useState(0);
  const [countLow, setCountLow] = useState(0);
  const [countTotal, setCountTotal] = useState(0);
  const [severityOpen, setSeverityOpen] = useState(false);

  const severityDisplay = (val: string) =>
    val === "" ? "All Severities" : val.charAt(0).toUpperCase() + val.slice(1);

  useEffect(() => {
    api.get<PaginatedResponse<DetectionListEntry>>("/api/detections?limit=10000")
      .then((all) => {
        setCountTotal(all.data.length);
        setCountCrit(all.data.filter((d) => d.severity === "critical").length);
        setCountHigh(all.data.filter((d) => d.severity === "high").length);
        setCountMed(all.data.filter((d) => d.severity === "medium").length);
        setCountLow(all.data.filter((d) => d.severity === "low").length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (severity) params.set("severity", severity);
    if (search) params.set("search", search);
    api.get<PaginatedResponse<DetectionListEntry>>(`/api/detections?${params}`)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load detections"))
      .finally(() => setLoading(false));
  }, [page, severity, search]);

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

  const severityDot = (s: string) =>
    s === "critical" ? "bg-red" : s === "high" ? "bg-tertiary" : s === "medium" ? "bg-amber" : "bg-on-surface-variant/30";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Detections</h1>
          <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">Threat signal events</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", count: countTotal, color: "text-on-surface" },
          { label: "Critical", count: countCrit, color: "text-red" },
          { label: "High", count: countHigh, color: "text-tertiary" },
          { label: "Medium", count: countMed, color: "text-amber" },
          { label: "Low", count: countLow, color: "text-on-surface-variant" },
        ].map(({ label, count, color }) => (
          <button key={label} onClick={() => { setSeverity(label === "Total" ? "" : label.toLowerCase()); setPage(1); }}
            className={cn("panel p-3 text-center transition-all",
              (label === "Total" && severity === "") || severity === label.toLowerCase() ? "ring-1 ring-primary/30" : "")}>
            <p className={cn("text-[22px] font-headline font-extrabold", color)}>{count}</p>
            <p className="text-[9px] font-mono text-on-surface-variant/60 uppercase tracking-wider mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search detectors, IPs, paths..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default/40 bg-surface-0/30">
                {["Severity", "Detector", "IP", "Path", "Method", "Score", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-[11px] font-mono text-on-surface-variant/40">No detections</td></tr>
              ) : data.data.map((d) => (
                <tr key={d.id} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", severityDot(d.severity))} />
                      <span className="text-[10px] font-mono uppercase">{d.severity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface max-w-[220px] truncate">{d.detectorName}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface">{d.requestIp}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-on-surface-variant max-w-[200px] truncate">{d.requestPath}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border", methodColor(d.requestMethod))}>{d.requestMethod}</span>
                  </td>
                  <td className={cn("px-4 py-3 text-[12px] font-mono font-bold",
                    d.score >= 50 ? "text-red" : d.score >= 30 ? "text-tertiary" : "text-on-surface-variant")}>{d.score}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{timeAgo(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && (
        <Pagination page={page} pages={data.pagination.pages} total={data.pagination.total} label="detections" onPageChange={setPage} />
      )}
    </div>
  );
}
