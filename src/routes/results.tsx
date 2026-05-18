import { Fragment, useEffect, useMemo, useState } from "react";
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
import { Pencil, Save, Loader2, FileBarChart, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

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
const SUBJECTS = ["English", "Mathematics", "Science"] as const;
type Subject = (typeof SUBJECTS)[number];

type Roster = { id: string; name: string; className: string };
type Scores = Partial<Record<Subject, { ca: number; exam: number }>>;
type ScoreMap = Record<string, Scores>;

const gradeOf = (total: number): { grade: string; tone: string } => {
  if (total >= 75) return { grade: "A", tone: "bg-accent/15 text-accent border-accent/30" };
  if (total >= 65) return { grade: "B", tone: "bg-primary/10 text-primary border-primary/30" };
  if (total >= 50) return { grade: "C", tone: "bg-warning/15 text-warning border-warning/30" };
  if (total >= 40) return { grade: "D", tone: "bg-warning/15 text-warning border-warning/30" };
  return { grade: "F", tone: "bg-destructive/10 text-destructive border-destructive/30" };
};

const subjectTotal = (s?: { ca: number; exam: number }) => (s ? s.ca + s.exam : 0);
const overallTotal = (sc: Scores) => SUBJECTS.reduce((sum, sub) => sum + subjectTotal(sc[sub]), 0);
const overallMax = SUBJECTS.length * 100;

const toArray = (data: unknown): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).results)) return (data as any).results;
  return [];
};

function ResultsPage() {
  const [term, setTerm] = useState(TERMS[2]);
  const [className, setClassName] = useState("");
  const [allStudents, setAllStudents] = useState<Roster[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [scores, setScores] = useState<ScoreMap>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [editing, setEditing] = useState<Roster | null>(null);
  const [draft, setDraft] = useState<Scores>({});
  const [saving, setSaving] = useState(false);

  // Load students
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
          name: s.full_name ?? s.name ?? [s.first_name, s.last_name].filter(Boolean).join(" ") ?? "—",
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

  // Load results
  useEffect(() => {
    if (!className) return;
    let cancelled = false;
    (async () => {
      setLoadingScores(true);
      try {
        const res = await apiFetch(`/api/results/?term=${encodeURIComponent(term)}&class_name=${encodeURIComponent(className)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const next: ScoreMap = {};
        toArray(data).forEach((r: any) => {
          const sid = String(r.student?.id ?? r.student_id ?? r.student ?? "");
          const sub = (r.subject ?? "") as Subject;
          if (!sid || !SUBJECTS.includes(sub)) return;
          const key = `${term}|${sid}`;
          next[key] = next[key] ?? {};
          next[key]![sub] = {
            ca: Number(r.ca ?? r.ca_score ?? 0),
            exam: Number(r.exam ?? r.exam_score ?? 0),
          };
        });
        setScores((m) => ({ ...m, ...next }));
      } catch {
        // silent — empty state via no rows
      } finally {
        if (!cancelled) setLoadingScores(false);
      }
    })();
    return () => { cancelled = true; };
  }, [term, className]);

  const openEdit = (s: Roster) => {
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

  const saveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payloads = SUBJECTS.filter((sub) => draft[sub]).map((sub) => ({
        student: editing.id,
        term,
        class_name: className,
        subject: sub,
        ca: draft[sub]!.ca,
        exam: draft[sub]!.exam,
      }));
      const results = await Promise.all(
        payloads.map((p) =>
          apiFetch("/api/results/", { method: "POST", body: JSON.stringify(p) }),
        ),
      );
      if (results.some((r) => !r.ok)) throw new Error("Some scores failed to save");
      setScores((m) => ({ ...m, [`${term}|${editing.id}`]: draft }));
      toast.success(`Scores saved for ${editing.name}.`);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">Enter CA and exam scores per student.</p>
          </div>
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
                <Select value={className} onValueChange={setClassName} disabled={classes.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results table */}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            {loadingStudents ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
              </div>
            ) : studentsError ? (
              <div className="text-center py-12">
                <p className="text-sm text-destructive">{studentsError}</p>
              </div>
            ) : allStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                  <UsersRound className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No students enrolled yet</p>
                <p className="text-sm text-muted-foreground">Add students to enter their results.</p>
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                  <FileBarChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No results for this class yet</p>
                <p className="text-sm text-muted-foreground">Select a class with students to begin.</p>
              </div>
            ) : (
              <>
                {loadingScores && (
                  <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading scores…
                  </p>
                )}
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
                              <Badge variant="outline" className={cn(g.tone)}>{g.grade}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
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
                  <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Scores
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
