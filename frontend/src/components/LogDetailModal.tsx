import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Globe, Browser, Hash, WarningCircle, Clock } from "@phosphor-icons/react";
import { api } from "../lib/api";
import type { RequestLogDetail } from "../types";
import SeverityBadge from "./SeverityBadge";
import ActionBadge from "./ActionBadge";
import { cn } from "../lib/utils";

interface Props {
  requestId: string | null;
  onClose: () => void;
}

const methodBadge = (m: string) => {
  const map: Record<string, string> = {
    GET: "bg-emerald/10 text-emerald border-emerald/20",
    POST: "bg-blue/10 text-blue border-blue/20",
    PUT: "bg-amber/10 text-amber border-amber/20",
    PATCH: "bg-amber/10 text-amber border-amber/20",
    DELETE: "bg-rose/10 text-rose border-rose/20",
  };
  return map[m] || "bg-surface-container text-on-surface-variant border-outline-variant/30";
};

function RiskGauge({ score }: { score: number }) {
  const clamped = Math.min(score, 100);
  const color =
    clamped >= 80 ? "stroke-red-500" :
    clamped >= 60 ? "stroke-orange-500" :
    clamped >= 30 ? "stroke-amber-500" :
    clamped > 0 ? "stroke-emerald-400" :
    "stroke-emerald-400";
  const dashOffset = 88 - (clamped / 100) * 88;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="42" height="42" viewBox="0 0 36 36" className="transform -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
          className="text-surface-container-high" />
        <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeLinecap="round"
          className={color} strokeDasharray="88" strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }} />
      </svg>
      <span className={cn(
        "absolute text-[11px] font-bold font-mono",
        clamped >= 80 ? "text-red" :
        clamped >= 60 ? "text-orange" :
        clamped >= 30 ? "text-amber" :
        "text-emerald"
      )}>
        {String(score).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function LogDetailModal({ requestId, onClose }: Props) {
  const [data, setData] = useState<RequestLogDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"headers" | "cookies" | "fields" | "detections">("detections");

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    setData(null);
    api.get<RequestLogDetail>(`/api/logs/${requestId}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [requestId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!requestId) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest w-full max-w-3xl max-h-[85vh] rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <h2 className="font-headline font-extrabold text-[15px] text-on-surface">Request Detail</h2>
            {data && (
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono border", methodBadge(data.method))}>
                {data.method}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-center py-16 text-on-surface-variant text-[12px] font-mono">{error}</div>
          )}
          {data && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <RiskGauge score={data.riskScore ?? 0} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span className="text-[13px] font-mono text-on-surface">{data.ip}</span>
                    {data.country && <span className="text-[10px] text-on-surface-variant">{data.country}{data.city ? `, ${data.city}` : ""}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
                    <span>{data.path}</span>
                    {data.queryString && <span className="text-on-surface-variant/60">?{data.queryString}</span>}
                  </div>
                </div>
                <ActionBadge action={data.actionTaken || "log"} />
              </div>

              <div className="flex gap-1 border-b border-outline-variant/20">
                {(["detections", "headers", "cookies", "fields"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors",
                      activeTab === tab ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface")}>
                    {tab} ({tab === "detections" ? data.detections?.length ?? 0 : tab === "headers" ? Object.keys(data.headers || {}).length : tab === "cookies" ? Object.keys(data.cookies || {}).length : data.fields?.length ?? 0})
                  </button>
                ))}
              </div>

              <div className="min-h-[120px]">
                {activeTab === "detections" && (
                  <div className="space-y-2">
                    {(!data.detections || data.detections.length === 0) ? (
                      <p className="text-[11px] font-mono text-on-surface-variant/50 text-center py-8">No detections</p>
                    ) : data.detections.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/10">
                        <SeverityBadge severity={d.severity} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-mono text-on-surface block truncate">{d.detectorName}</span>
                          {d.matchedValue && <span className="text-[10px] font-mono text-on-surface-variant block truncate">{d.matchedValue}</span>}
                        </div>
                        <span className="text-[10px] font-mono text-on-surface-variant">{d.source}/{d.fieldName}</span>
                        <span className="text-[11px] font-mono font-bold text-on-surface">+{d.score}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "headers" && (
                  <div className="space-y-1">
                    {Object.entries(data.headers || {}).length === 0 ? (
                      <p className="text-[11px] font-mono text-on-surface-variant/50 text-center py-8">No headers</p>
                    ) : Object.entries(data.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-3 py-1.5 border-b border-outline-variant/10 text-[11px] font-mono">
                        <span className="text-on-surface-variant shrink-0 w-48 truncate">{k}</span>
                        <span className="text-on-surface truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "cookies" && (
                  <div className="space-y-1">
                    {Object.entries(data.cookies || {}).length === 0 ? (
                      <p className="text-[11px] font-mono text-on-surface-variant/50 text-center py-8">No cookies</p>
                    ) : Object.entries(data.cookies || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-3 py-1.5 border-b border-outline-variant/10 text-[11px] font-mono">
                        <span className="text-on-surface-variant shrink-0 w-48 truncate">{k}</span>
                        <span className="text-on-surface truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "fields" && (
                  <div className="space-y-1">
                    {(!data.fields || data.fields.length === 0) ? (
                      <p className="text-[11px] font-mono text-on-surface-variant/50 text-center py-8">No fields</p>
                    ) : data.fields.map((f) => (
                      <div key={f.id} className="flex gap-3 py-1.5 border-b border-outline-variant/10 text-[11px] font-mono">
                        <span className="text-on-surface-variant/60 shrink-0 w-16">{f.source}</span>
                        <span className="text-on-surface-variant shrink-0 w-48 truncate">{f.key}</span>
                        <span className="text-on-surface truncate">{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
