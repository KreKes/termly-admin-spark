import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results — Termly" }, { name: "description", content: "Student academic results and report sheets." }] }),
  component: () => (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Results</h1>
        <p className="text-sm text-muted-foreground mb-6">Termly results and report sheets.</p>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Results module coming soon.</CardContent></Card>
      </div>
    </AppShell>
  ),
});
