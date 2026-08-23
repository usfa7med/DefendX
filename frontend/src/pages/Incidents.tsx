import { ArrowRight, Shield, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Incident, PaginatedResponse } from "../types";
import Pagination from "../components/Pagination";
import { timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";

export default function Incidents() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Incident> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse<Incident>>(`/api/incidents?page=${page}&limit=50`)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load incidents"))
      .finally(() => setLoading(false));
  }, [page]);

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

  const severityDot = (s: string) =>
    s === "critical" ? "bg-red" : s === "high" ? "bg-tertiary" : s === "medium" ? "bg-amber" : "bg-on-surface-variant/30";

  const severityText = (s: string) =>
    s === "critical" ? "text-red" : s === "high" ? "text-tertiary" : s === "medium" ? "text-amber" : "text-on-surface-variant";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Incidents</h1>
        <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">Security incident log</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default/40 bg-surface-0/30">
                {["IP", "Type", "Severity", "Score", "Action", "Status", "Started"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-[11px] font-mono text-on-surface-variant/40">No incidents recorded</td></tr>
              ) : data.data.map((inc) => (
                <tr key={inc.id} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface">{inc.ip}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-on-surface-variant">{inc.incidentType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", severityDot(inc.severity))} />
                      <span className={cn("text-[10px] font-mono uppercase", severityText(inc.severity))}>{inc.severity}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-[12px] font-mono font-bold",
                    (inc.score ?? 0) >= 80 ? "text-red" : (inc.score ?? 0) >= 40 ? "text-tertiary" : "text-on-surface-variant")}>{inc.score ?? 0}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant">{inc.actionTaken || ""}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono",
                      inc.endedAt ? "bg-surface-container text-on-surface-variant" : "bg-tertiary/10 text-tertiary")}>
                      {inc.endedAt ? "Resolved" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{timeAgo(inc.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && (
        <Pagination page={page} pages={data.pagination.pages} total={data.pagination.total} label="incidents" onPageChange={setPage} />
      )}
    </div>
  );
}
