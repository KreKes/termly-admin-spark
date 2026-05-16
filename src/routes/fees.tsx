import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/fees")({
  head: () => ({ meta: [{ title: "Fees — Termly" }, { name: "description", content: "Track fee collection and outstanding balances." }] }),
  component: () => (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Fees</h1>
        <p className="text-sm text-muted-foreground mb-6">Track collections, invoices and outstanding balances.</p>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Fee management coming soon.</CardContent></Card>
      </div>
    </AppShell>
  ),
});
