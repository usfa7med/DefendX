import { Monitor } from "lucide-react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Detections from "./pages/Detections";
import Incidents from "./pages/Incidents";
import BlockedIPs from "./pages/BlockedIPs";
import Whitelist from "./pages/Whitelist";
import NotFound from "./pages/NotFound";

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [location.pathname]);

  return <div ref={pageRef}>{children}</div>;
}


function MobileNotice() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("mobile-notice-dismissed") === "true");

  if (dismissed) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-surface-container-lowest w-full sm:max-w-sm mx-4 rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-primary" />
            <h2 className="font-headline font-semibold text-[15px] text-on-surface">Desktop Recommended</h2>
          </div>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            This website is designed for desktop, so use it on desktop to get the full experience.
          </p>
          <button
            onClick={() => {
              localStorage.setItem("mobile-notice-dismissed", "true");
              setDismissed(true);
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px] active:scale-[0.98] transition-transform"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MobileNotice />
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            }
          />
          <Route
            path="/logs"
            element={
              <PageTransition>
                <Logs />
              </PageTransition>
            }
          />
          <Route
            path="/detections"
            element={
              <PageTransition>
                <Detections />
              </PageTransition>
            }
          />
          <Route
            path="/incidents"
            element={
              <PageTransition>
                <Incidents />
              </PageTransition>
            }
          />
          <Route
            path="/blocked"
            element={
              <PageTransition>
                <BlockedIPs />
              </PageTransition>
            }
          />
          <Route
            path="/whitelist"
            element={
              <PageTransition>
                <Whitelist />
              </PageTransition>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
