import {
  BadgeCheck, Ban, FileText, LayoutDashboard, Menu, Radar, TriangleAlert, X,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview", mono: "SYS_OVERVIEW" },
  { to: "/logs", icon: FileText, label: "Request Logs", mono: "INGEST_ARC" },
  { to: "/detections", icon: Radar, label: "Detections", mono: "SIGNAL_EVENTS" },
  { to: "/incidents", icon: TriangleAlert, label: "Incidents", mono: "INCIDENT_LOG" },
  { to: "/blocked", icon: Ban, label: "Access Control", mono: "BAN_HAMMER" },
  { to: "/whitelist", icon: BadgeCheck, label: "Whitelist", mono: "TRUSTED_NODES" },
];

export default function Layout() {
  const location = useLocation();
  const brandRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const el = brandRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll(".brand-piece"), {
        opacity: 0,
        y: -8,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, brandRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface-container-low border-r border-outline-variant/20 flex flex-col transition-transform duration-300 md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div ref={brandRef} className="px-5 py-5 border-b border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Radar className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <span className="brand-piece font-headline font-extrabold text-[15px] tracking-tight text-on-surface block">DefendX</span>
                <span className="brand-piece text-[9px] font-mono text-on-surface-variant tracking-widest uppercase">SENTINEL WAF</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="truncate">{item.label}</span>
                <span className="text-[8px] font-mono tracking-widest uppercase text-on-surface-variant/60 group-hover:text-on-surface-variant/80">{item.mono}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-outline-variant/20">
          <p className="text-[10px] font-mono text-on-surface-variant/60 text-center leading-relaxed">
            Built by <a href="https://usfahmed.dev" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary transition-colors">Youssef Ahmed Abdelfatah</a>
            <br />
            <span className="text-[8.5px]">&copy; 2026 DefendX. All Rights Reserved.</span>
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-sm">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-[10px] font-mono text-on-surface-variant tracking-wider uppercase">SYSTEM ONLINE</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
