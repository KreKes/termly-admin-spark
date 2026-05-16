import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Termly" }, { name: "description", content: "Daily attendance records by class." }] }),
  component: () => (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Attendance</h1>
        <p className="text-sm text-muted-foreground mb-6">Daily attendance records by class.</p>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Attendance log coming soon.</CardContent></Card>
      </div>
    </AppShell>
  ),
});
