import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: "primary" | "success" | "warning";
  trend?: string;
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-accent/10 text-accent",
  warning: "bg-warning/15 text-warning-foreground",
};

export function StatCard({ label, value, hint, icon, accent = "primary", trend }: StatCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground truncate">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", accentMap[accent])}>
            {icon}
          </div>
        </div>
        {trend && (
          <p className="mt-3 text-xs font-medium text-accent">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
