import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Termly" }, { name: "description", content: "School profile, terms and user settings." }] }),
  component: () => (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">School profile, terms and user preferences.</p>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Settings coming soon.</CardContent></Card>
      </div>
    </AppShell>
  ),
});
