import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "gold" | "default" | "success" | "danger";
  trend?: { value: string; positive: boolean };
}

export function MetricCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: MetricCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-6 flex flex-col gap-4",
      variant === "gold"
        ? "bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30"
        : variant === "success"
        ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
        : variant === "danger"
        ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
        : "bg-navy-light border-white/10"
    )}>
      {/* Background icon decoration */}
      <div className="absolute right-4 top-4 opacity-10">
        <Icon className="h-16 w-16" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          variant === "gold" ? "bg-gold/20 text-gold" :
          variant === "success" ? "bg-emerald-500/20 text-emerald-400" :
          variant === "danger" ? "bg-red-500/20 text-red-400" :
          "bg-white/10 text-slate-300"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div>
        <p className={cn(
          "text-2xl font-bold tracking-tight",
          variant === "gold" ? "text-gold" : "text-white"
        )}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn("text-xs mt-1", trend.positive ? "text-emerald-400" : "text-red-400")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
