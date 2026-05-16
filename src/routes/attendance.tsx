import { useMemo, useState } from "react";
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
  CalendarIcon, Save, CheckCircle2, XCircle, Clock, FileText, Users,
} from "lucide-react";
import { toast } from "sonner";

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

const CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

const ROSTER: Roster[] = [
  { id: "1", firstName: "Chinedu", lastName: "Okeke", admissionNo: "TRM/2024/001", className: "JSS 2" },
  { id: "2", firstName: "Aisha", lastName: "Bello", admissionNo: "TRM/2024/002", className: "SSS 1" },
  { id: "3", firstName: "Tunde", lastName: "Adeyemi", admissionNo: "TRM/2024/003", className: "SSS 3" },
  { id: "4", firstName: "Ngozi", lastName: "Ibe", admissionNo: "TRM/2024/004", className: "JSS 1" },
  { id: "5", firstName: "Yusuf", lastName: "Garba", admissionNo: "TRM/2024/005", className: "SSS 2" },
  { id: "6", firstName: "Funmi", lastName: "Adesanya", admissionNo: "TRM/2023/088", className: "SSS 3" },
  { id: "7", firstName: "Kemi", lastName: "Ojo", admissionNo: "TRM/2024/006", className: "JSS 2" },
  { id: "8", firstName: "Ibrahim", lastName: "Sani", admissionNo: "TRM/2024/007", className: "JSS 2" },
  { id: "9", firstName: "Chiamaka", lastName: "Nwosu", admissionNo: "TRM/2024/008", className: "JSS 2" },
  { id: "10", firstName: "David", lastName: "Eze", admissionNo: "TRM/2024/009", className: "SSS 1" },
  { id: "11", firstName: "Amina", lastName: "Lawal", admissionNo: "TRM/2024/010", className: "SSS 1" },
  { id: "12", firstName: "Segun", lastName: "Falade", admissionNo: "TRM/2024/011", className: "JSS 1" },
];

const STATUSES: Status[] = ["Present", "Absent", "Late", "Excused"];

const statusStyles: Record<Status, string> = {
  Present: "bg-accent/15 text-accent border-accent/40 hover:bg-accent/20",
  Absent: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15",
  Late: "bg-warning/15 text-warning border-warning/40 hover:bg-warning/20",
  Excused: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
};

function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [className, setClassName] = useState<string>("JSS 2");
  const [calOpen, setCalOpen] = useState(false);

  const roster = useMemo(
    () => ROSTER.filter((s) => s.className === className),
    [className],
  );

  // attendance keyed by `${dateISO}|${studentId}` so it persists across class switches
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const dateKey = format(date, "yyyy-MM-dd");
  const keyFor = (id: string) => `${dateKey}|${id}`;

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
  }, [roster, marks, dateKey]);

  const markAllPresent = () => {
    setMarks((m) => {
      const next = { ...m };
      for (const s of roster) next[keyFor(s.id)] = "Present";
      return next;
    });
    toast.success("All marked Present.");
  };

  const save = () => {
    if (counts.Unmarked > 0) {
      toast.warning(`${counts.Unmarked} student(s) still unmarked.`);
      return;
    }
    toast.success(`Attendance saved for ${className} · ${format(date, "PPP")}.`);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">Mark daily attendance by class.</p>
          </div>
          <Button onClick={save} className="bg-primary hover:bg-primary/90 self-start sm:self-auto">
            <Save className="h-4 w-4" />
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
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
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
                {className} <span className="text-muted-foreground font-normal">· {format(date, "EEE, MMM d")}</span>
              </h2>
              <Button size="sm" variant="outline" onClick={markAllPresent} disabled={roster.length === 0}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark all present
              </Button>
            </div>

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

void FileText;
