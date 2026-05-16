import { useMemo, useState } from "react";
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
import { Search, Plus, Receipt, Banknote, CreditCard, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

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
  notes?: string;
};

const CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

const STUDENTS = [
  { name: "Chinedu Okeke", className: "JSS 2" },
  { name: "Aisha Bello", className: "SSS 1" },
  { name: "Tunde Adeyemi", className: "SSS 3" },
  { name: "Ngozi Ibe", className: "JSS 1" },
  { name: "Yusuf Garba", className: "SSS 2" },
  { name: "Funmi Adesanya", className: "SSS 3" },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: "1", student: "Chinedu Okeke", className: "JSS 2", amount: 150000, date: "2026-05-14", receiptNo: "RCP-00231", method: "Transfer", status: "Paid" },
  { id: "2", student: "Aisha Bello", className: "SSS 1", amount: 90000, date: "2026-05-13", receiptNo: "RCP-00230", method: "Cash", status: "Partial" },
  { id: "3", student: "Ngozi Ibe", className: "JSS 1", amount: 120000, date: "2026-05-12", receiptNo: "RCP-00229", method: "Transfer", status: "Paid" },
  { id: "4", student: "Tunde Adeyemi", className: "SSS 3", amount: 75000, date: "2026-05-11", receiptNo: "RCP-00228", method: "Card", status: "Partial" },
  { id: "5", student: "Funmi Adesanya", className: "SSS 3", amount: 200000, date: "2026-05-10", receiptNo: "RCP-00227", method: "Transfer", status: "Paid" },
];

const FEE_STRUCTURE = [
  { className: "JSS 1", tuition: 120000, boarding: 80000, books: 15000, uniform: 12000 },
  { className: "JSS 2", tuition: 130000, boarding: 80000, books: 16000, uniform: 12000 },
  { className: "JSS 3", tuition: 140000, boarding: 80000, books: 17000, uniform: 12000 },
  { className: "SSS 1", tuition: 160000, boarding: 90000, books: 20000, uniform: 14000 },
  { className: "SSS 2", tuition: 170000, boarding: 90000, books: 20000, uniform: 14000 },
  { className: "SSS 3", tuition: 180000, boarding: 90000, books: 22000, uniform: 14000 },
];

const naira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });

const emptyForm = {
  student: "",
  amount: "",
  method: "Transfer" as Method,
  notes: "",
};

function FeesPage() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.student.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q),
    );
  }, [payments, query]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.student || !amt || amt <= 0) {
      toast.error("Select a student and enter a valid amount.");
      return;
    }
    const student = STUDENTS.find((s) => s.name === form.student);
    const next: Payment = {
      id: crypto.randomUUID(),
      student: form.student,
      className: student?.className ?? "—",
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      receiptNo: "RCP-" + String(232 + payments.length - INITIAL_PAYMENTS.length).padStart(5, "0"),
      method: form.method,
      status: "Paid",
      notes: form.notes,
    };
    setPayments((arr) => [next, ...arr]);
    toast.success("Payment recorded.");
    setForm(emptyForm);
    setOpen(false);
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="mt-0">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Fee Structure · Term 3, 2025/26</h2>
                  <p className="text-sm text-muted-foreground">Amounts charged per student per class per term (in Naira).</p>
                </div>
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
                      {FEE_STRUCTURE.map((f) => {
                        const total = f.tuition + f.boarding + f.books + f.uniform;
                        return (
                          <TableRow key={f.className}>
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
              <Label className="text-xs font-medium text-foreground/80">Student Name <span className="text-destructive">*</span></Label>
              <Select value={form.student} onValueChange={(v) => setForm({ ...form, student: v })}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {STUDENTS.map((s) => (
                    <SelectItem key={s.name} value={s.name}>{s.name} — {s.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Receipt className="h-4 w-4" /> Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

// keep CLASSES exported as part of the module for potential reuse
void CLASSES;
