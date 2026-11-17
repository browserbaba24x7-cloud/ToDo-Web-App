// reset-password-page.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "./auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    const confirm = String(f.get("confirm"));
    setError("");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");
    if (pw !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: pw,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      toast.success("Password reset");
      navigate("/app/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password to secure your account.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">New password</label>
          <Input name="password" type="password" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Confirm password</label>
          <Input name="confirm" type="password" required />
        </div>
        {error && <p className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating…" : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
};