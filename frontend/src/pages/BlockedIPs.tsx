import { Ban, ChevronDown, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { api } from "../lib/api";
import type { BlockedIP, PaginatedResponse } from "../types";
import { timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";

export default function BlockedIPs() {
  const [data, setData] = useState<PaginatedResponse<BlockedIP> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newBlockType, setNewBlockType] = useState("permanent");
  const [typeOpen, setTypeOpen] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchBlocked = () => {
    setLoading(true);
    api.get<PaginatedResponse<BlockedIP>>("/api/blocked-ips")
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load blocked IPs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBlocked(); }, []);

  useEffect(() => {
    if (showAdd && formRef.current) {
      gsap.from(formRef.current, { opacity: 0, y: -8, duration: 0.25, ease: "power2.out" });
    }
  }, [showAdd]);

  const handleAdd = async () => {
    const ip = newIP.trim();
    if (!ip || submitting) return;
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    if (!ipRegex.test(ip)) {
      setError("Please enter a valid IPv4 address (e.g. 192.168.1.1)");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/blocked-ips", { ip, reason: newReason.trim() || "Manual block", block_type: newBlockType });
      setNewIP(""); setNewReason(""); setShowAdd(false);
      fetchBlocked();
    } catch (err: any) {
      setError(err.message || "Failed to add block rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (ipAddr: string) => { setUnblockTarget(ipAddr); };

  const confirmUnblock = useCallback(async () => {
    if (!unblockTarget) return;
    try {
      await api.delete(`/api/blocked-ips/${unblockTarget}`);
      setUnblockTarget(null);
      fetchBlocked();
    } catch (err: any) {
      setError(err.message || "Failed to unblock IP");
      setUnblockTarget(null);
    }
  }, [unblockTarget]);

  if (error && !data) {
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

  return (
    <div className="space-y-5">
      <ConfirmDialog open={!!unblockTarget} title="Unblock IP?" message={`Remove ${unblockTarget} from the blocked list?`} onConfirm={confirmUnblock} onCancel={() => setUnblockTarget(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Access Control</h1>
          <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">IP ban management</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-mono font-bold hover:bg-primary/90 transition-colors">
          <Plus className="w-3 h-3" /> Block IP
        </button>
      </div>

      {showAdd && (
        <div ref={formRef} className="panel p-4 space-y-3">
          {error && <p className="text-[11px] font-mono text-error">{error}</p>}
          <div className="flex gap-3">
            <input value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="IP address (e.g. 192.168.1.1)"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
            <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Reason (optional)"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
            <div className="relative">
              <button onClick={() => setTypeOpen(!typeOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[11px] font-mono text-on-surface-variant">
                {newBlockType === "permanent" ? "Permanent" : "Temporary"} <ChevronDown className="w-3 h-3" />
              </button>
              {typeOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xl z-10 overflow-hidden">
                  {[{ v: "permanent", l: "Permanent" }, { v: "temporary", l: "Temporary" }].map(({ v, l }) => (
                    <button key={v} onClick={() => { setNewBlockType(v); setTypeOpen(false); }}
                      className={cn("w-full px-3 py-2 text-[11px] font-mono text-left hover:bg-surface-container transition-colors",
                        newBlockType === v ? "text-primary bg-primary/5" : "text-on-surface-variant")}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleAdd} disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[11px] font-mono font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default/40 bg-surface-0/30">
                {["IP", "Reason", "Type", "Offenses", "Blocked At", "Expires", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={7} className="text-center py-16 text-[11px] font-mono text-on-surface-variant/40">No blocked IPs</td></tr>
              ) : data.data.map((b) => (
                <tr key={b.ip} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface font-bold">{b.ip}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-on-surface-variant max-w-[200px] truncate">{b.reason || ""}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono",
                      b.blockType === "permanent" ? "bg-error/10 text-error" : "bg-amber/10 text-amber")}>
                      {b.blockType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface-variant">{b.totalOffenses ?? 1}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{timeAgo(b.blockedAt)}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{b.expiresAt ? timeAgo(b.expiresAt) : ""}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleUnblock(b.ip)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
