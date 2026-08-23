import { useRef, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react";

type IconComponent = React.ComponentType<any>;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconComponent;
  trend?: { value: number; label?: string };
  accent?: "default" | "emerald" | "amber" | "rose" | "red" | "blue";
  sparkline?: ReactNode;
  subtitle?: string;
}

const accents = {
  default: { border: "border-accent/10", iconBg: "bg-accent-dim", iconText: "text-accent", bar: "bg-accent" },
  emerald: { border: "border-emerald/10", iconBg: "bg-emerald/8", iconText: "text-emerald", bar: "bg-emerald" },
  amber: { border: "border-amber/10", iconBg: "bg-amber-dim", iconText: "text-amber", bar: "bg-amber" },
  rose: { border: "border-rose/10", iconBg: "bg-rose-dim", iconText: "text-rose", bar: "bg-rose" },
  red: { border: "border-red/10", iconBg: "bg-red-dim", iconText: "text-red", bar: "bg-red" },
  blue: { border: "border-blue/10", iconBg: "bg-blue-dim", iconText: "text-blue", bar: "bg-blue" },
};

export default function StatsCard({
  title, value, icon: Icon, trend, accent = "default", sparkline, subtitle,
}: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const a = accents[accent];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "panel p-5 group cursor-default flex flex-col justify-between min-h-[130px]",
        "hover:-translate-y-0.5 transition-transform duration-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">{title}</p>
          <p className="text-[28px] font-headline font-extrabold text-on-surface leading-none tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] font-mono text-on-surface-variant/50">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 text-[10px] font-mono", trend.value >= 0 ? "text-emerald" : "text-rose")}>
              {trend.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}</span>
            </div>
          )}
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", a.iconBg)}>
          <Icon className={cn("w-4.5 h-4.5", a.iconText)} />
        </div>
      </div>
      {sparkline && (
        <div className="mt-3 pt-3 border-t border-outline-variant/10">
          {sparkline}
        </div>
      )}
      <div className={cn("absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500", a.bar)} />
    </div>
  );
}
