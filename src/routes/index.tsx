import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Users, CalendarCheck, AlertCircle, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Termly" },
      { name: "description", content: "Bursar dashboard for Nigerian private schools — fees, attendance and payments at a glance." },
    ],
  }),
  component: Dashboard,
});

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

const recentPayments = [
  { name: "Chinedu Eze", class: "JSS 2A", amount: 145000, method: "Transfer", time: "10:24 AM", status: "Completed" },
  { name: "Aisha Bello", class: "SSS 1B", amount: 180000, method: "Card", time: "09:51 AM", status: "Completed" },
  { name: "Tunde Adeyemi", class: "Primary 5", amount: 95000, method: "Cash", time: "09:12 AM", status: "Completed" },
  { name: "Ngozi Umeh", class: "JSS 3A", amount: 160000, method: "Transfer", time: "Yesterday", status: "Completed" },
  { name: "Femi Balogun", class: "SSS 2A", amount: 75000, method: "Transfer", time: "Yesterday", status: "Partial" },
];

function Dashboard() {
  const collected = 24_850_000;
  const expected = 38_400_000;
  const pct = Math.round((collected / expected) * 100);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Good morning, Adaeze</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening at your school today — Second Term, 2025/2026.
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Record Payment
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Fees Collected"
            value={naira(collected)}
            hint={`of ${naira(expected)} expected`}
            icon={<Wallet className="h-5 w-5" />}
            accent="success"
            trend={`▲ ${pct}% of term target`}
          />
          <StatCard
            label="Outstanding"
            value="142"
            hint="students with unpaid balance"
            icon={<AlertCircle className="h-5 w-5" />}
            accent="warning"
          />
          <StatCard
            label="Attendance Today"
            value="93.4%"
            hint="812 of 869 students present"
            icon={<CalendarCheck className="h-5 w-5" />}
            accent="primary"
          />
          <StatCard
            label="Total Students"
            value="869"
            hint="across 18 classes"
            icon={<Users className="h-5 w-5" />}
            accent="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Term Fee Collection</CardTitle>
                  <CardDescription>Progress toward this term's target</CardDescription>
                </div>
                <Badge className="bg-accent/15 text-accent hover:bg-accent/15 border-transparent">
                  {pct}% Collected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{naira(collected)} collected</span>
                  <span className="font-medium text-foreground">{naira(expected)}</span>
                </div>
                <Progress value={pct} className="h-2.5" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Tuition", v: 78, amt: naira(18_200_000) },
                  { label: "Boarding", v: 62, amt: naira(4_300_000) },
                  { label: "Other Fees", v: 41, amt: naira(2_350_000) },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{c.amt}</p>
                    <Progress value={c.v} className="h-1.5 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Today's Attendance</CardTitle>
              <CardDescription>Monday, 18 May 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">812</span>
                <span className="text-sm text-muted-foreground">/ 869 present</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Present", count: 812, color: "bg-accent" },
                  { label: "Absent", count: 41, color: "bg-destructive" },
                  { label: "Late", count: 16, color: "bg-warning" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                      <span className="text-foreground">{r.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">{r.count}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full">View attendance log</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Recent Payments</CardTitle>
                <CardDescription>Latest fee payments received</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary">View all</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground border-y border-border/70 bg-muted/30">
                <div className="col-span-4">Student</div>
                <div className="col-span-2">Class</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              <div className="divide-y divide-border/70">
                {recentPayments.map((p, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-sm hover:bg-muted/30 transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.time}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-muted-foreground">{p.class}</div>
                    <div className="col-span-2 text-muted-foreground">{p.method}</div>
                    <div className="col-span-2 text-right font-semibold text-foreground">{naira(p.amount)}</div>
                    <div className="col-span-2 text-right">
                      <Badge
                        variant="secondary"
                        className={p.status === "Completed" ? "bg-accent/15 text-accent" : "bg-warning/20 text-warning-foreground"}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border/70">
              {recentPayments.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                    {p.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <p className="font-semibold text-foreground whitespace-nowrap">{naira(p.amount)}</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>{p.class} • {p.method}</span>
                      <span>{p.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
