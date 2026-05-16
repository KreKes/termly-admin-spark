import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Lock, LockOpen, Pencil, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Termly" },
      { name: "description", content: "Enter and review student term results by class." },
    ],
  }),
  component: ResultsPage,
});

const TERMS = ["Term 1, 2025/26", "Term 2, 2025/26", "Term 3, 2025/26"];
const CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
const SUBJECTS = ["English", "Mathematics", "Science"] as const;
type Subject = (typeof SUBJECTS)[number];

type Roster = { id: string; name: string; className: string };

const ROSTER: Roster[] = [
  { id: "1", name: "Chinedu Okeke", className: "JSS 2" },
  { id: "7", name: "Kemi Ojo", className: "JSS 2" },
  { id: "8", name: "Ibrahim Sani", className: "JSS 2" },
  { id: "9", name: "Chiamaka Nwosu", className: "JSS 2" },
  { id: "2", name: "Aisha Bello", className: "SSS 1" },
  { id: "10", name: "David Eze", className: "SSS 1" },
  { id: "11", name: "Amina Lawal", className: "SSS 1" },
  { id: "4", name: "Ngozi Ibe", className: "JSS 1" },
  { id: "12", name: "Segun Falade", className: "JSS 1" },
  { id: "3", name: "Tunde Adeyemi", className: "SSS 3" },
  { id: "6", name: "Funmi Adesanya", className: "SSS 3" },
  { id: "5", name: "Yusuf Garba", className: "SSS 2" },
];

type Scores = Partial<Record<Subject, { ca: number; exam: number }>>;
// key: `${term}|${studentId}` -> scores
type ScoreMap = Record<string, Scores>;

const SEED: ScoreMap = {
  "Term 3, 2025/26|1": { English: { ca: 26, exam: 58 }, Mathematics: { ca: 22, exam: 49 }, Science: { ca: 28, exam: 62 } },
  "Term 3, 2025/26|7": { English: { ca: 24, exam: 51 }, Mathematics: { ca: 19, exam: 42 }, Science: { ca: 25, exam: 55 } },
  "Term 3, 2025/26|8": { English: { ca: 20, exam: 45 }, Mathematics: { ca: 28, exam: 64 }, Science: { ca: 22, exam: 50 } },
  "Term 3, 2025/26|9": { English: { ca: 29, exam: 66 }, Mathematics: { ca: 27, exam: 60 }, Science: { ca: 30, exam: 68 } },
};

const gradeOf = (total: number): { grade: string; tone: string } => {
  if (total >= 75) return { grade: "A", tone: "bg-accent/15 text-accent border-accent/30" };
  if (total >= 65) return { grade: "B", tone: "bg-primary/10 text-primary border-primary/30" };
  if (total >= 50) return { grade: "C", tone: "bg-warning/15 text-warning border-warning/30" };
  if (total >= 40) return { grade: "D", tone: "bg-warning/15 text-warning border-warning/30" };
  return { grade: "F", tone: "bg-destructive/10 text-destructive border-destructive/30" };
};

const subjectTotal = (s?: { ca: number; exam: number }) =>
  s ? s.ca + s.exam : 0;

const overallTotal = (sc: Scores) =>
  SUBJECTS.reduce((sum, sub) => sum + subjectTotal(sc[sub]), 0);

const overallMax = SUBJECTS.length * 100;

function ResultsPage() {
  const [term, setTerm] = useState(TERMS[2]);
  const [className, setClassName] = useState("JSS 2");
  const [scores, setScores] = useState<ScoreMap>(SEED);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Roster | null>(null);
  const [draft, setDraft] = useState<Scores>({});

  const lockKey = `${term}|${className}`;
  const isLocked = !!locked[lockKey];

  const roster = useMemo(
    () => ROSTER.filter((s) => s.className === className),
    [className],
  );

  const openEdit = (s: Roster) => {
    if (isLocked) {
      toast.error("Results are locked. Unlock to edit.");
      return;
    }
    setEditing(s);
    setDraft(scores[`${term}|${s.id}`] ?? {});
  };

  const updateDraft = (sub: Subject, field: "ca" | "exam", raw: string) => {
    const max = field === "ca" ? 30 : 70;
    const n = Math.max(0, Math.min(max, Number(raw) || 0));
    setDraft((d) => ({
      ...d,
      [sub]: { ca: d[sub]?.ca ?? 0, exam: d[sub]?.exam ?? 0, [field]: n },
    }));
  };

  const saveScores = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setScores((m) => ({ ...m, [`${term}|${editing.id}`]: draft }));
    toast.success(`Scores saved for ${editing.name}.`);
    setEditing(null);
  };

  const toggleLock = () => {
    setLocked((l) => {
      const next = { ...l, [lockKey]: !l[lockKey] };
      toast.success(next[lockKey] ? "Results locked." : "Results unlocked for editing.");
      return next;
    });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">Enter CA and exam scores per student.</p>
          </div>
          <Button
            onClick={toggleLock}
            className={cn(
              "self-start sm:self-auto",
              isLocked
                ? "bg-warning hover:bg-warning/90 text-warning-foreground"
                : "bg-primary hover:bg-primary/90",
            )}
          >
            {isLocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isLocked ? "Unlock Results" : "Lock Results"}
          </Button>
        </div>

        {/* Controls */}
        <Card className="border-border/70 shadow-sm mb-4">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isLocked && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                <Lock className="h-4 w-4" />
                Results for {className} · {term} are locked.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results table */}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead rowSpan={2} className="align-bottom">Student Name</TableHead>
                    {SUBJECTS.map((sub) => (
                      <TableHead key={sub} colSpan={2} className="text-center border-l border-border">
                        {sub}
                      </TableHead>
                    ))}
                    <TableHead rowSpan={2} className="align-bottom text-right border-l border-border">Total</TableHead>
                    <TableHead rowSpan={2} className="align-bottom text-center">Grade</TableHead>
                    <TableHead rowSpan={2} className="align-bottom text-right">Actions</TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {SUBJECTS.map((sub) => (
                      <Fragment key={sub}>
                        <TableHead className="text-center text-xs font-normal text-muted-foreground border-l border-border">CA /30</TableHead>
                        <TableHead className="text-center text-xs font-normal text-muted-foreground">Exam /70</TableHead>
                      </Fragment>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((s) => {
                    const sc = scores[`${term}|${s.id}`] ?? {};
                    const total = overallTotal(sc);
                    const pct = (total / overallMax) * 100;
                    const g = gradeOf(pct);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                        {SUBJECTS.map((sub) => (
                          <Fragment key={sub}>
                            <TableCell className="text-center text-sm border-l border-border">
                              {sc[sub]?.ca ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {sc[sub]?.exam ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          </Fragment>
                        ))}
                        <TableCell className="text-right font-semibold text-foreground border-l border-border">
                          {total}<span className="text-muted-foreground font-normal">/{overallMax}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={g.tone}>{g.grade}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => openEdit(s)}
                            disabled={isLocked}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {roster.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={SUBJECTS.length * 2 + 4} className="text-center text-muted-foreground py-10">
                        No students in this class yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Scores — {editing.name}</DialogTitle>
                <DialogDescription>{className} · {term}</DialogDescription>
              </DialogHeader>
              <form onSubmit={saveScores} className="space-y-4 pt-2">
                {SUBJECTS.map((sub) => {
                  const t = subjectTotal(draft[sub]);
                  return (
                    <div key={sub} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">{sub}</p>
                        <span className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{t}/100</span></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">CA (max 30)</Label>
                          <Input
                            type="number" min={0} max={30} inputMode="numeric"
                            value={draft[sub]?.ca ?? ""}
                            onChange={(e) => updateDraft(sub, "ca", e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">Exam (max 70)</Label>
                          <Input
                            type="number" min={0} max={70} inputMode="numeric"
                            value={draft[sub]?.exam ?? ""}
                            onChange={(e) => updateDraft(sub, "exam", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-semibold text-foreground">{overallTotal(draft)} / {overallMax}</span>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Save className="h-4 w-4" /> Save Scores
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
