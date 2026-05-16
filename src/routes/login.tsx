import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { login, getSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Termly" },
      { name: "description", content: "Sign in to your Termly school administration account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getSession()) navigate({ to: "/" });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      toast.success(`Welcome back, ${session.user.first_name || session.user.username}!`);
      navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-primary/5 flex flex-col items-center justify-center px-4 py-10">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-foreground">Termly</span>
          <span className="text-[11px] text-muted-foreground -mt-0.5">School Administration</span>
        </div>
      </Link>

      <Card className="w-full max-w-md border-border/60 shadow-xl shadow-primary/5">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage your school.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground/80">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username" type="text" autoComplete="username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.username"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/80">Password</Label>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset link sent if the email is registered.")}
                  className="text-xs font-medium text-accent hover:text-accent/80 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password" type={showPwd ? "text" : "password"} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 h-10 mt-2">
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need an account for your school?{" "}
            <span className="font-medium text-accent">Contact sales</span>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Termly. All rights reserved.
      </p>
    </div>
  );
}
