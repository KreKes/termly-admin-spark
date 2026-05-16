import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — Termly" }, { name: "description", content: "Manage student records, classes and enrollment." }] }),
  component: () => (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Students</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage student records and enrollment.</p>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Student directory coming soon.</CardContent></Card>
      </div>
    </AppShell>
  ),
});
