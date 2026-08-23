import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="relative mb-8">
        <div className="text-[120px] font-headline font-extrabold tracking-tighter text-surface-container-high select-none leading-none">
          404
        </div>
      </div>

      <h1 className="text-xl font-headline font-extrabold text-on-surface mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
        The route you're looking for doesn't exist or has been moved.
        Check the URL or head back to the dashboard.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-mono text-[12px] font-bold hover:bg-primary transition-colors shadow-md shadow-primary/20"
      >
        <LayoutDashboard className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
