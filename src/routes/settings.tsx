import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Upload, Plus, CheckCircle2, Sparkles, CreditCard, Calendar,
  Save, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Termly" },
      { name: "description", content: "Manage school profile, staff users and your subscription." },
    ],
  }),
  component: SettingsPage,
});

type Role = "Owner" | "Admin" | "Bursar" | "Teacher";
type UserStatus = "Active" | "Pending" | "Suspended";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};

const ROLES: Role[] = ["Owner", "Admin", "Bursar", "Teacher"];

const INITIAL_USERS: StaffUser[] = [
  { id: "1", name: "Adaeze Okafor", email: "adaeze@brightfuture.edu.ng", role: "Owner", status: "Active" },
  { id: "2", name: "Samuel Adetola", email: "samuel@brightfuture.edu.ng", role: "Admin", status: "Active" },
  { id: "3", name: "Grace Eze", email: "grace@brightfuture.edu.ng", role: "Bursar", status: "Active" },
  { id: "4", name: "Mr. Bello", email: "bello@brightfuture.edu.ng", role: "Teacher", status: "Active" },
  { id: "5", name: "Mrs. Idris", email: "idris@brightfuture.edu.ng", role: "Teacher", status: "Pending" },
];

const roleStyles: Record<Role, string> = {
  Owner: "bg-primary/10 text-primary border-primary/30",
  Admin: "bg-primary/10 text-primary border-primary/30",
  Bursar: "bg-accent/15 text-accent border-accent/30",
  Teacher: "bg-muted text-foreground border-border",
};

const statusStyles: Record<UserStatus, string> = {
  Active: "bg-accent/15 text-accent border-accent/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Suspended: "bg-destructive/10 text-destructive border-destructive/30",
};

function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your school profile, team and subscription.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="profile">School Profile</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0"><SchoolProfileTab /></TabsContent>
          <TabsContent value="users" className="mt-0"><UsersTab /></TabsContent>
          <TabsContent value="subscription" className="mt-0"><SubscriptionTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* ----- School Profile tab ----- */

function SchoolProfileTab() {
  const [profile, setProfile] = useState({
    name: "Bright Future Academy",
    address: "12 Adeola Odeku Street, Victoria Island, Lagos",
    phone: "+234 803 555 0100",
    email: "info@brightfuture.edu.ng",
  });
  const [logo, setLogo] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error("School name is required.");
      return;
    }
    toast.success("School profile updated.");
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={save} className="space-y-6">
          {/* Logo */}
          <div>
            <Label className="text-xs font-medium text-foreground/80">School Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border border-dashed border-border bg-muted/40 grid place-items-center overflow-hidden">
                {logo ? (
                  <img src={logo} alt="School logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {profile.name.charAt(0) || "S"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInput} type="file" accept="image/*"
                  className="hidden" onChange={onLogo}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="School Name" required>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ----- Users tab ----- */

function UsersTab() {
  const [users, setUsers] = useState<StaffUser[]>(INITIAL_USERS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Teacher" as Role, tempPassword: "" });

  const generatePwd = () => {
    const pwd = Math.random().toString(36).slice(-10) + "!";
    setForm((f) => ({ ...f, tempPassword: pwd }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.tempPassword) {
      toast.error("Fill in all required fields.");
      return;
    }
    setUsers((arr) => [
      ...arr,
      { id: crypto.randomUUID(), name: form.name, email: form.email, role: form.role, status: "Pending" },
    ]);
    toast.success(`Invite sent to ${form.email}.`);
    setForm({ name: "", email: "", role: "Teacher", tempPassword: "" });
    setOpen(false);
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Staff Users</h2>
            <p className="text-xs text-muted-foreground">{users.length} users · {users.filter(u => u.status === "Active").length} active</p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        {/* Desktop */}
        <div className="hidden md:block rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        {u.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleStyles[u.role]}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[u.status]}>{u.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                    {u.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusStyles[u.status]}>{u.status}</Badge>
              </div>
              <Badge variant="outline" className={cn("mt-1", roleStyles[u.role])}>{u.role}</Badge>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Invite a staff member to your school account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Temporary Password" required>
              <div className="flex gap-2">
                <Input
                  value={form.tempPassword}
                  onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                  placeholder="Set a one-time password"
                />
                <Button type="button" variant="outline" onClick={generatePwd} title="Generate">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">User will be prompted to change it on first login.</p>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ----- Subscription tab ----- */

function SubscriptionTab() {
  const plan = {
    name: "Growth",
    price: "₦45,000",
    cycle: "per term",
    nextBilling: "September 12, 2026",
    studentCap: 500,
    studentsUsed: 312,
    features: [
      "Up to 500 students",
      "Unlimited staff users",
      "Fees, attendance & results modules",
      "Email & SMS notifications",
      "Priority support",
    ],
  };
  const usagePct = Math.round((plan.studentsUsed / plan.studentCap) * 100);

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/15 px-2 py-1 rounded-md mb-2">
                <Sparkles className="h-3 w-3" /> Current Plan
              </div>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-sm text-primary-foreground/80 mt-1">
                <span className="text-xl font-semibold text-primary-foreground">{plan.price}</span> {plan.cycle}
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground self-start sm:self-auto">
              <Sparkles className="h-4 w-4" /> Upgrade Plan
            </Button>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoTile icon={<Calendar className="h-4 w-4" />} label="Next billing date" value={plan.nextBilling} />
            <InfoTile icon={<CreditCard className="h-4 w-4" />} label="Payment method" value="Card ending 4242" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Student usage</span>
              <span className="font-medium text-foreground">{plan.studentsUsed} / {plan.studentCap}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">What's included</p>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">Billing history</p>
            <p className="text-xs text-muted-foreground">Download past invoices and receipts.</p>
          </div>
          <Button variant="outline" onClick={() => toast.info("No invoices to download yet.")}>
            View Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----- shared bits ----- */

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
