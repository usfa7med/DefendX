import { Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { api } from "../lib/api";
import type { WhitelistEntry, PaginatedResponse } from "../types";
import Pagination from "../components/Pagination";
import { timeAgo } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Whitelist() {
  const [data, setData] = useState<PaginatedResponse<WhitelistEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [crosslistTarget, setCrosslistTarget] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchWhitelist = () => {
    setLoading(true);
    setError(null);
    api.get<PaginatedResponse<WhitelistEntry>>(`/api/whitelist?page=${page}&limit=50`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWhitelist(); }, [page]);

  useEffect(() => {
    if (showAdd && formRef.current) {
      gsap.from(formRef.current, { opacity: 0, y: -8, duration: 0.25, ease: "power2.out" });
    }
  }, [showAdd]);

  const performAdd = async (ip: string, reason: string) => {
    setSubmitting(true);
    try {
      if (crosslistTarget) {
        try { await api.delete(`/api/blocked-ips/${ip}`); } catch(e) {}
      }
      await api.post("/api/whitelist", { ip, reason: reason || "Manual whitelist" });
      setNewIP(""); setNewReason(""); setShowAdd(false); setCrosslistTarget(null);
      fetchWhitelist();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
      const res = await api.get<any>("/api/blocked-ips?limit=1000");
      const isBlocked = res.data && Array.isArray(res.data) && res.data.some((b: any) => b.ip === ip);
      if (isBlocked && crosslistTarget !== ip) {
        setCrosslistTarget(ip);
        setSubmitting(false);
        return;
      }
      await performAdd(ip, newReason.trim());
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleRemove = async (ipAddr: string) => { setRemoveTarget(ipAddr); };

  const confirmRemove = useCallback(async () => {
    if (!removeTarget) return;
    try {
      await api.delete(`/api/whitelist/${removeTarget}`);
      setRemoveTarget(null);
      fetchWhitelist();
    } catch (err: any) {
      setError(err.message);
      setRemoveTarget(null);
    }
  }, [removeTarget]);

  return (
    <div className="space-y-5">
      <ConfirmDialog open={!!removeTarget} title="Remove from Whitelist?" message={`Remove ${removeTarget} from the trusted list?`} onConfirm={confirmRemove} onCancel={() => setRemoveTarget(null)} />
      {crosslistTarget && (
        <ConfirmDialog open={true} title="IP is currently blocked" message={`${crosslistTarget} is in the blocked list. Unblock and whitelist it?`}
          onConfirm={() => performAdd(crosslistTarget, newReason.trim())} onCancel={() => { setCrosslistTarget(null); setSubmitting(false); }} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-headline font-extrabold text-on-surface tracking-tight">Whitelist</h1>
          <p className="text-[11px] font-mono text-on-surface-variant/60 mt-0.5">Trusted nodes bypass all analysis</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald text-white text-[11px] font-mono font-bold hover:bg-emerald/90 transition-colors">
          <Plus className="w-3 h-3" /> Whitelist IP
        </button>
      </div>

      {showAdd && (
        <div ref={formRef} className="panel p-4 space-y-3">
          {error && <p className="text-[11px] font-mono text-error">{error}</p>}
          <div className="flex gap-3">
            <input value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="IP address"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
            <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Reason (optional)"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[12px] font-mono text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40" />
            <button onClick={handleAdd} disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald text-white text-[11px] font-mono font-bold hover:bg-emerald/90 transition-colors disabled:opacity-50">
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
                {["IP", "Reason", "Added By", "Added At", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={5} className="text-center py-16 text-[11px] font-mono text-on-surface-variant/40">No whitelisted IPs</td></tr>
              ) : data.data.map((w) => (
                <tr key={w.ip} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
                      <span className="text-[12px] font-mono text-on-surface font-bold">{w.ip}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-on-surface-variant max-w-[200px] truncate">{w.reason || " "}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-on-surface-variant">{w.createdBy || " "}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-on-surface-variant/60">{timeAgo(w.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemove(w.ip)}
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

      {data && (
        <Pagination page={page} pages={data.pagination.pages} total={data.pagination.total} label="entries" onPageChange={setPage} />
      )}
    </div>
  );
}
