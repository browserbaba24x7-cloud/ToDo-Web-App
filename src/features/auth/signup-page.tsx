import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const SignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    const confirm = String(f.get("confirm"));
    setError("");
    if (!name) return setError("Please enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        toast.success("Account created!");
        navigate("/app/dashboard", { replace: true });
      } else {
        toast.success("Check your email to confirm your account, then sign in.");
        navigate("/login", { replace: true });
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start organizing your work in minutes.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Full name</label>
          <Input name="name" placeholder="Alex Morgan" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Email</label>
          <Input name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Password</label>
          <Input name="password" type="password" placeholder="••••••••" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Confirm password</label>
          <Input name="confirm" type="password" placeholder="••••••••" required />
        </div>
        {error && <p className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-[12.5px] text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};