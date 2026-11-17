// forgot-password-page.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
      toast.success("If an account exists for that email, a reset link has been sent.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send a reset link. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a link to reset your password.">
      {sent ? (
        <div className="space-y-3 text-[13px]">
          <p className="rounded-clay bg-success/35 px-3 py-2 text-success-foreground shadow-clay-inset">If an account exists for that email, a reset link has been sent.</p>
          <Link to="/login" className="block text-center text-[12.5px] text-primary hover:underline">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Email</label>
            <Input name="email" type="email" placeholder="you@example.com" required />
          </div>
          {error && <p className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <Link to="/login" className="block text-center text-[12.5px] text-primary hover:underline">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
};