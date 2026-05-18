import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon, Save, CheckCircle2, XCircle, Clock, Users, Loader2, UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Termly" },
      { name: "description", content: "Mark and review daily student attendance per class." },
    ],
  }),
  component: AttendancePage,
});

type Status = "Present" | "Absent" | "Late" | "Excused";

type Roster = { id: string; firstName: string; lastName: string; admissionNo: string; className: string };

const STATUSES: Status[] = ["Present", "Absent", "Late", "Excused"];

const statusStyles: Record<Status, string> = {
  Present: "bg-accent/15 text-accent border-accent/40 hover:bg-accent/20",
  Absent: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15",
  Late: "bg-warning/15 text-warning border-warning/40 hover:bg-warning/20",
  Excused: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
};

const toArray = (data: unknown): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).results)) return (data as any).results;
  return [];
};

const normalizeStatus = (s: unknown): Status | undefined => {
  const v = String(s ?? "").toLowerCase();
  if (v.startsWith("p")) return "Present";
  if (v.startsWith("a")) return "Absent";
  if (v.startsWith("l")) return "Late";
  if (v.startsWith("e")) return "Excused";
  return undefined;
};

function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [className, setClassName] = useState<string>("");
  const [calOpen, setCalOpen] = useState(false);

  const [allStudents, setAllStudents] = useState<Roster[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateKey = format(date, "yyyy-MM-dd");
  const keyFor = (id: string) => `${dateKey}|${id}`;

  // Load students once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStudents(true);
      setStudentsError(null);
      try {
        const res = await apiFetch("/api/students/");
        if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        const roster: Roster[] = toArray(data).map((s: any) => ({
          id: String(s.id ?? ""),
          firstName: s.first_name ?? (s.full_name ?? s.name ?? "").split(" ")[0] ?? "",
          lastName: s.last_name ?? (s.full_name ?? s.name ?? "").split(" ").slice(1).join(" "),
          admissionNo: s.admission_number ?? s.admission_no ?? "—",
          className: s.current_class_name ?? s.class_name ?? "—",
        }));
        setAllStudents(roster);
        const classes = Array.from(new Set(roster.map((r) => r.className).filter((c) => c && c !== "—")));
        if (classes.length && !className) setClassName(classes[0]);
      } catch (e) {
        if (!cancelled) setStudentsError(e instanceof Error ? e.message : "Failed to load students");
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.className).filter((c) => c && c !== "—"))),
    [allStudents],
  );

  const roster = useMemo(
    () => allStudents.filter((s) => s.className === className),
    [allStudents, className],
  );

  // Load attendance for date+class
  useEffect(() => {
    if (!className) return;
    let cancelled = false;
    (async () => {
      setLoadingAtt(true);
      try {
        const res = await apiFetch(`/api/attendance/?date=${dateKey}&class_name=${encodeURIComponent(className)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const next: Record<string, Status> = {};
        toArray(data).forEach((r: any) => {
          const sid = String(r.student?.id ?? r.student_id ?? r.student ?? "");
          const st = normalizeStatus(r.status);
          if (sid && st) next[`${dateKey}|${sid}`] = st;
        });
        setMarks((m) => ({ ...m, ...next }));
      } catch {
        // silent: empty state shows blank selectors
      } finally {
        if (!cancelled) setLoadingAtt(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dateKey, className]);

  const setStatus = (id: string, status: Status) =>
    setMarks((m) => ({ ...m, [keyFor(id)]: status }));

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0, Excused: 0, Unmarked: 0 };
    for (const s of roster) {
      const v = marks[keyFor(s.id)];
      if (v) c[v]++;
      else c.Unmarked++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, marks, dateKey]);

  const markAllPresent = () => {
    setMarks((m) => {
      const next = { ...m };
      for (const s of roster) next[keyFor(s.id)] = "Present";
      return next;
    });
    toast.success("All marked Present.");
  };

  const save = async () => {
    if (counts.Unmarked > 0) {
      toast.warning(`${counts.Unmarked} student(s) still unmarked.`);
      return;
    }
    setSaving(true);
    const records = roster.map((s) => ({
      student: s.id,
      date: dateKey,
      status: marks[keyFor(s.id)].toLowerCase(),
    }));
    try {
      // Try bulk first
      let res = await apiFetch("/api/attendance/", {
        method: "POST",
        body: JSON.stringify(records),
      });
      if (!res.ok && res.status >= 400 && res.status < 500) {
        // Fallback to per-record posts
        const results = await Promise.all(
          records.map((r) =>
            apiFetch("/api/attendance/", { method: "POST", body: JSON.stringify(r) }),
          ),
        );
        if (results.some((r) => !r.ok)) throw new Error("Some records failed to save");
      } else if (!res.ok) {
        throw new Error(`Failed (${res.status})`);
      }
      toast.success(`Attendance saved for ${className} · ${format(date, "PPP")}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">Mark daily attendance by class.</p>
          </div>
          <Button
            onClick={save}
            disabled={saving || roster.length === 0}
            className="bg-primary hover:bg-primary/90 self-start sm:self-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Attendance
          </Button>
        </div>

        {/* Controls */}
        <Card className="border-border/70 shadow-sm mb-4">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Date</Label>
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }}
                      initialFocus
                      disabled={(d) => d > new Date()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Class</Label>
                <Select value={className} onValueChange={setClassName} disabled={classes.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Total" value={roster.length} tone="muted" />
          <SummaryTile icon={<CheckCircle2 className="h-4 w-4" />} label="Present" value={counts.Present} tone="accent" />
          <SummaryTile icon={<XCircle className="h-4 w-4" />} label="Absent" value={counts.Absent} tone="destructive" />
          <SummaryTile icon={<Clock className="h-4 w-4" />} label="Late" value={counts.Late} tone="warning" />
        </div>

        {/* Roster */}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-base font-semibold text-foreground">
                {className || "—"} <span className="text-muted-foreground font-normal">· {format(date, "EEE, MMM d")}</span>
              </h2>
              <Button size="sm" variant="outline" onClick={markAllPresent} disabled={roster.length === 0}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark all present
              </Button>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
              </div>
            ) : studentsError ? (
              <div className="text-center py-12">
                <p className="text-sm text-destructive mb-3">{studentsError}</p>
              </div>
            ) : allStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                  <UsersRound className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No students enrolled yet</p>
                <p className="text-sm text-muted-foreground">Add students to mark attendance.</p>
              </div>
            ) : (
              <>
                {loadingAtt && (
                  <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading attendance…
                  </p>
                )}
                {/* Desktop */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Admission Number</TableHead>
                        <TableHead className="w-[260px]">Attendance Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((s) => {
                        const current = marks[keyFor(s.id)];
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium text-foreground">{s.firstName} {s.lastName}</TableCell>
                            <TableCell className="text-muted-foreground">{s.admissionNo}</TableCell>
                            <TableCell>
                              <Select value={current ?? ""} onValueChange={(v) => setStatus(s.id, v as Status)}>
                                <SelectTrigger className={cn("h-9", current && statusStyles[current])}>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUSES.map((st) => (
                                    <SelectItem key={st} value={st}>
                                      <span className="inline-flex items-center gap-2">
                                        <StatusDot status={st} /> {st}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {roster.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                            No students in this class yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {roster.map((s) => {
                    const current = marks[keyFor(s.id)];
                    return (
                      <div key={s.id} className="rounded-lg border border-border p-4">
                        <div className="mb-3">
                          <p className="font-medium text-foreground">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.admissionNo}</p>
                        </div>
                        <Select value={current ?? ""} onValueChange={(v) => setStatus(s.id, v as Status)}>
                          <SelectTrigger className={cn("h-9", current && statusStyles[current])}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((st) => (
                              <SelectItem key={st} value={st}>
                                <span className="inline-flex items-center gap-2">
                                  <StatusDot status={st} /> {st}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {roster.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">No students in this class yet.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryTile({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "muted" | "accent" | "destructive" | "warning" | "primary";
}) {
  const toneStyles: Record<typeof tone, string> = {
    muted: "bg-muted text-foreground",
    accent: "bg-accent/15 text-accent",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/15 text-warning",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", toneStyles[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    Present: "bg-accent",
    Absent: "bg-destructive",
    Late: "bg-warning",
    Excused: "bg-primary",
  };
  return <span className={cn("h-2 w-2 rounded-full", map[status])} />;
}
