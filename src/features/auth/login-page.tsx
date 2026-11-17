import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setError("");
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      toast.success("Welcome back!");
      const from = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname;
      navigate(from || "/app/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Enter your credentials to access your workspace.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Email</label>
          <Input name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[13px] font-medium">Password</label>
            <Link to="/forgot-password" className="text-[12px] text-primary hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Input name="password" type={showPw ? "text" : "password"} placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        {error && <p className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-[12.5px] text-muted-foreground">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
};