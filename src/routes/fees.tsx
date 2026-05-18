import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Receipt, Banknote, CreditCard, ArrowLeftRight, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "Fees — Termly" },
      { name: "description", content: "Record fee payments and manage the fee structure per class." },
    ],
  }),
  component: FeesPage,
});

type Method = "Cash" | "Transfer" | "Card";
type PayStatus = "Paid" | "Partial" | "Pending";

type Payment = {
  id: string;
  student: string;
  className: string;
  amount: number;
  date: string;
  receiptNo: string;
  method: Method;
  status: PayStatus;
};

type FeeStructure = {
  id: string;
  className: string;
  tuition: number;
  boarding: number;
  books: number;
  uniform: number;
};

type ApiStudent = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  current_class_name?: string;
  class_name?: string;
};

const naira = (n: number) =>
  "₦" + (Number(n) || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 });

const toArray = (data: unknown): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).results)) return (data as any).results;
  return [];
};

const normalizeMethod = (m: unknown): Method => {
  const s = String(m ?? "").toLowerCase();
  if (s.includes("cash")) return "Cash";
  if (s.includes("card")) return "Card";
  return "Transfer";
};

const normalizeStatus = (s: unknown, amount: number, balance?: number): PayStatus => {
  const v = String(s ?? "").toLowerCase();
  if (v.includes("paid") || v === "completed" || v === "success") return "Paid";
  if (v.includes("partial")) return "Partial";
  if (v.includes("pending")) return "Pending";
  if (typeof balance === "number") {
    if (balance <= 0) return "Paid";
    if (balance < amount) return "Partial";
    return "Pending";
  }
  return "Paid";
};

const mapPayment = (p: any): Payment => {
  const amount = Number(p.amount ?? p.amount_paid ?? p.total ?? 0);
  return {
    id: String(p.id ?? crypto.randomUUID()),
    student: p.student_name ?? p.student?.full_name ?? p.student?.name ??
      [p.student?.first_name, p.student?.last_name].filter(Boolean).join(" ") ?? "—",
    className: p.class_name ?? p.student_class ?? p.student?.current_class_name ?? "—",
    amount,
    date: (p.payment_date ?? p.date ?? p.created_at ?? "").toString().slice(0, 10),
    receiptNo: p.receipt_no ?? p.receipt_number ?? p.reference ?? `RCP-${String(p.id ?? "").padStart(5, "0")}`,
    method: normalizeMethod(p.method ?? p.payment_method),
    status: normalizeStatus(p.status, amount, p.balance != null ? Number(p.balance) : undefined),
  };
};

const mapFeeStructure = (f: any): FeeStructure => ({
  id: String(f.id ?? f.class_name ?? crypto.randomUUID()),
  className: f.class_name ?? f.className ?? f.name ?? "—",
  tuition: Number(f.tuition ?? f.tuition_fee ?? 0),
  boarding: Number(f.boarding ?? f.boarding_fee ?? 0),
  books: Number(f.books ?? f.books_fee ?? 0),
  uniform: Number(f.uniform ?? f.uniform_fee ?? 0),
});

const emptyForm = {
  student: "",
  amount: "",
  method: "Transfer" as Method,
  notes: "",
};

function FeesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; className: string }[]>([]);
  const [loadingPay, setLoadingPay] = useState(true);
  const [loadingStruct, setLoadingStruct] = useState(true);
  const [payError, setPayError] = useState<string | null>(null);
  const [structError, setStructError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPayments = async () => {
    setLoadingPay(true);
    setPayError(null);
    try {
      const res = await apiFetch("/api/payments/");
      if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);
      const data = await res.json();
      setPayments(toArray(data).map(mapPayment));
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoadingPay(false);
    }
  };

  const loadStructures = async () => {
    setLoadingStruct(true);
    setStructError(null);
    try {
      const res = await apiFetch("/api/fee-structures/");
      if (!res.ok) throw new Error(`Failed to load fee structures (${res.status})`);
      const data = await res.json();
      setStructures(toArray(data).map(mapFeeStructure));
    } catch (e) {
      setStructError(e instanceof Error ? e.message : "Failed to load fee structures");
    } finally {
      setLoadingStruct(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await apiFetch("/api/students/");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(
        toArray(data).map((s: ApiStudent) => ({
          id: String(s.id ?? ""),
          name: s.full_name ?? s.name ?? [s.first_name, s.last_name].filter(Boolean).join(" ") ?? "—",
          className: s.current_class_name ?? s.class_name ?? "—",
        })),
      );
    } catch {
      // optional
    }
  };

  useEffect(() => {
    loadPayments();
    loadStructures();
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) => p.student.toLowerCase().includes(q) || p.receiptNo.toLowerCase().includes(q),
    );
  }, [payments, query]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.student || !amt || amt <= 0) {
      toast.error("Select a student and enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/payments/", {
        method: "POST",
        body: JSON.stringify({
          student: form.student,
          amount: amt,
          method: form.method.toLowerCase(),
          notes: form.notes,
          payment_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Failed (${res.status})`);
      }
      toast.success("Payment recorded.");
      setForm(emptyForm);
      setOpen(false);
      loadPayments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const statusStyles: Record<PayStatus, string> = {
    Paid: "bg-accent/15 text-accent border-accent/30",
    Partial: "bg-warning/15 text-warning border-warning/30",
    Pending: "bg-muted text-muted-foreground border-border",
  };

  const methodIcon: Record<Method, React.ReactNode> = {
    Cash: <Banknote className="h-3.5 w-3.5" />,
    Transfer: <ArrowLeftRight className="h-3.5 w-3.5" />,
    Card: <CreditCard className="h-3.5 w-3.5" />,
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fees</h1>
            <p className="text-sm text-muted-foreground">
              {payments.length} payments · {naira(totalCollected)} collected
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="collection">Fee Collection</TabsTrigger>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-0">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by student name or receipt number..."
                    className="pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
                  />
                </div>

                {loadingPay ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
                  </div>
                ) : payError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-destructive mb-3">{payError}</p>
                    <Button variant="outline" size="sm" onClick={loadPayments}>Retry</Button>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                      <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No payments recorded yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Record your first fee payment to get started.</p>
                    <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" /> Record Payment
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Student Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Amount Paid</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Receipt No.</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium text-foreground">{p.student}</TableCell>
                              <TableCell>{p.className}</TableCell>
                              <TableCell className="font-semibold text-foreground">{naira(p.amount)}</TableCell>
                              <TableCell className="text-muted-foreground">{p.date}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Receipt className="h-3.5 w-3.5" /> {p.receiptNo}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusStyles[p.status]}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filtered.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                No payments match your search.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {filtered.map((p) => (
                        <div key={p.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{p.student}</p>
                              <p className="text-xs text-muted-foreground">{p.className} · {p.date}</p>
                            </div>
                            <Badge variant="outline" className={statusStyles[p.status]}>{p.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-base font-semibold text-foreground">{naira(p.amount)}</span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              {methodIcon[p.method]} {p.receiptNo}
                            </span>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-10">
                          No payments match your search.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="mt-0">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Fee Structure</h2>
                  <p className="text-sm text-muted-foreground">Amounts charged per student per class per term (in Naira).</p>
                </div>

                {loadingStruct ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading fee structures…
                  </div>
                ) : structError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-destructive mb-3">{structError}</p>
                    <Button variant="outline" size="sm" onClick={loadStructures}>Retry</Button>
                  </div>
                ) : structures.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No fee structures defined yet</p>
                    <p className="text-sm text-muted-foreground">Add fee structures from your admin to see them here.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Tuition</TableHead>
                          <TableHead className="text-right">Boarding</TableHead>
                          <TableHead className="text-right">Books</TableHead>
                          <TableHead className="text-right">Uniform</TableHead>
                          <TableHead className="text-right">Total / Term</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {structures.map((f) => {
                          const total = f.tuition + f.boarding + f.books + f.uniform;
                          return (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium text-foreground">{f.className}</TableCell>
                              <TableCell className="text-right">{naira(f.tuition)}</TableCell>
                              <TableCell className="text-right">{naira(f.boarding)}</TableCell>
                              <TableCell className="text-right">{naira(f.books)}</TableCell>
                              <TableCell className="text-right">{naira(f.uniform)}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{naira(total)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a new fee payment from a student.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-foreground/80">Student <span className="text-destructive">*</span></Label>
              {students.length > 0 ? (
                <Select value={form.student} onValueChange={(v) => setForm({ ...form, student: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                  placeholder="Student ID"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Amount (₦) <span className="text-destructive">*</span></Label>
                <Input
                  type="number" min="0" step="500" inputMode="numeric"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground/80">Payment Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as Method })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-foreground/80">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes about this payment..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
