import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Eye, UserRound, Loader2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — Termly" },
      { name: "description", content: "Manage student records, classes and enrollment." },
    ],
  }),
  component: StudentsPage,
});

type Status = "Active" | "Inactive" | "Graduated";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  className: string;
  gender: "Male" | "Female";
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dob: string;
  status: Status;
};

const CLASSES = [
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3",
];

type ApiStudent = {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  current_class_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  status?: string | null;
};

function mapStudent(s: ApiStudent): Student {
  const g = (s.gender ?? "").toString().toUpperCase();
  const gender: "Male" | "Female" = g === "F" || g === "FEMALE" ? "Female" : "Male";
  const st = (s.status ?? "").toString().toLowerCase();
  const status: Status =
    st === "graduated" ? "Graduated" : st === "inactive" ? "Inactive" : "Active";
  return {
    id: s.id,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    admissionNo: s.admission_number ?? "",
    className: s.current_class_name ?? "—",
    gender,
    parentName: s.parent_name ?? "",
    parentPhone: s.parent_phone ?? "",
    parentEmail: s.parent_email ?? "",
    dob: s.date_of_birth ?? "",
    status,
  };
}

const empty = {
  firstName: "", lastName: "", admissionNo: "", dob: "",
  gender: "Male" as "Male" | "Female",
  className: "JSS 1",
  parentName: "", parentPhone: "", parentEmail: "",
};

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch("/api/students/");
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        const list: ApiStudent[] = Array.isArray(data) ? data : (data?.results ?? []);
        if (!cancelled) setStudents(list.map(mapStudent));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q),
    );
  }, [students, query]);

  const openAdd = () => {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNo: s.admissionNo,
      dob: s.dob,
      gender: s.gender,
      className: s.className,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
    });
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.admissionNo) {
      toast.error("Please fill in required fields.");
      return;
    }
    if (editingId) {
      setStudents((arr) =>
        arr.map((s) => (s.id === editingId ? { ...s, ...form } : s)),
      );
      toast.success("Student updated.");
    } else {
      setStudents((arr) => [
        ...arr,
        { id: crypto.randomUUID(), status: "Active", ...form },
      ]);
      toast.success("Student added.");
    }
    setOpen(false);
  };

  const statusStyles: Record<Status, string> = {
    Active: "bg-accent/15 text-accent border-accent/30",
    Inactive: "bg-muted text-muted-foreground border-border",
    Graduated: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Students</h1>
            <p className="text-sm text-muted-foreground">
              {students.length} enrolled · {students.filter((s) => s.status === "Active").length} active
            </p>
          </div>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or admission number..."
                className="pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
              />
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-foreground">
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.admissionNo}</TableCell>
                      <TableCell>{s.className}</TableCell>
                      <TableCell>{s.gender}</TableCell>
                      <TableCell className="text-muted-foreground">{s.parentPhone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[s.status]}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewing(s)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No students match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{s.admissionNo}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusStyles[s.status]}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                    <div><span className="text-foreground/60">Class:</span> {s.className}</div>
                    <div><span className="text-foreground/60">Gender:</span> {s.gender}</div>
                    <div className="col-span-2"><span className="text-foreground/60">Parent:</span> {s.parentPhone}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewing(s)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-10">
                  No students match your search.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
            <DialogDescription>
              Enter the student and parent/guardian details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Field label="First Name" required>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Last Name" required>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Admission Number" required>
              <Input value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} placeholder="TRM/2025/001" />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "Male" | "Female" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Class">
              <Select value={form.className} onValueChange={(v) => setForm({ ...form, className: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Parent / Guardian Name" className="sm:col-span-2">
              <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
            </Field>
            <Field label="Parent Phone">
              <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+234 ..." />
            </Field>
            <Field label="Parent Email">
              <Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
            </Field>

            <DialogFooter className="sm:col-span-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingId ? "Save Changes" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.firstName} {viewing.lastName}</DialogTitle>
                <DialogDescription>{viewing.admissionNo} · {viewing.className}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <Info label="Gender" value={viewing.gender} />
                <Info label="Date of Birth" value={viewing.dob || "—"} />
                <Info label="Status" value={viewing.status} />
                <Info label="Class" value={viewing.className} />
                <Info label="Parent / Guardian" value={viewing.parentName || "—"} />
                <Info label="Phone" value={viewing.parentPhone || "—"} />
                <Info label="Email" value={viewing.parentEmail || "—"} className="col-span-2" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => { const s = viewing; setViewing(null); openEdit(s); }}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
