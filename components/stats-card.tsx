"use client";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "primary" | "success" | "warning" | "destructive";
}

export function StatsCard({ label, value, icon, trend, color = "primary" }: StatsCardProps) {
  const colorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</span>
        {trend && (
          <span className="text-xs text-muted-foreground">{trend}</span>
        )}
      </div>
    </div>
  );
}
