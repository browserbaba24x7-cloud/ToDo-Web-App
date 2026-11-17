import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/store/theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/auth-context";

export const SettingsPage = () => {
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const accountName =
    (session?.user.user_metadata.full_name as string | undefined) ||
    (session?.user.user_metadata.name as string | undefined) ||
    session?.user.email?.split("@")[0] ||
    "User";
  const email = session?.user.email || "";
  const [profileName, setProfileName] = useState(accountName);
  const [profileEmail, setProfileEmail] = useState(email);
  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("fullName") || "").trim();
    const nextEmail = String(form.get("email") || "").trim();

    setProfileError("");
    if (!name) {
      setProfileError("Full name is required.");
      return;
    }
    if (!nextEmail) {
      setProfileError("Email is required.");
      return;
    }

    setProfileSaving(true);
    const emailChanged = nextEmail.toLowerCase() !== email.toLowerCase();
    try {
      const attributes: {
        data: { full_name: string };
        email?: string;
      } = { data: { full_name: name } };
      if (emailChanged) attributes.email = nextEmail;

      const { error } = await supabase.auth.updateUser(attributes, {
        emailRedirectTo: `${window.location.origin}/app/settings`,
      });
      if (error) {
        setProfileError(error.message);
        return;
      }

      setProfileName(name);
      setProfileEmail(emailChanged ? email : nextEmail);
      setProfileEditing(false);
      if (emailChanged) {
        toast.info("Name saved. Check your email to confirm the new address.");
      } else {
        toast.success("Profile updated.");
      }
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update your profile. Please try again.",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    setPasswordError("");
    if (!email) {
      setPasswordError("Your account email is unavailable. Please sign in again.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Choose a password different from your current one.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        setPasswordError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      formElement.reset();
      toast.success("Password updated.");
    } catch (requestError) {
      setPasswordError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update your password. Please try again.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight">Settings</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <section className="card p-5 space-y-3">
        <h3 className="text-[15px] font-semibold">Profile</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-extrabold text-primary-foreground shadow-clay">{initials}</div>
          <div>
            <p className="text-[14px] font-medium">{profileName}</p>
            <p className="text-[12px] text-muted-foreground">{profileEmail}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={() => {
              if (profileEditing) {
                setProfileName(accountName);
                setProfileEmail(email);
                setProfileError("");
              }
              setProfileEditing(!profileEditing);
            }}
          >
            {profileEditing ? "Cancel" : "Edit"}
          </Button>
        </div>
        {profileEditing && (
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label htmlFor="profileFullName" className="mb-1.5 block text-[13px] font-medium">Full name</label>
              <Input
                id="profileFullName"
                name="fullName"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="profileEmail" className="mb-1.5 block text-[13px] font-medium">Email</label>
              <Input
                id="profileEmail"
                name="email"
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                required
              />
            </div>
            {profileError && <p role="alert" className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{profileError}</p>}
            <Button type="submit" size="sm" disabled={profileSaving}>
              {profileSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </section>

      {/* Password */}
      <section className="card p-5 space-y-3">
        <h3 className="text-[15px] font-semibold">Password</h3>
        <form onSubmit={updatePassword} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-[13px] font-medium">Current password</label>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-[13px] font-medium">New password</label>
            <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={6} required />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium">Confirm new password</label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required />
          </div>
          {passwordError && <p role="alert" className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">{passwordError}</p>}
          <Button type="submit" size="sm" variant="secondary" disabled={passwordSaving}>
            {passwordSaving ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>

      {/* Appearance */}
      <section className="card p-5 space-y-3">
        <h3 className="text-[15px] font-semibold">Appearance</h3>
        <p className="text-[12.5px] text-muted-foreground">Choose your preferred theme</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id as any)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border p-3 text-[13px] transition-colors",
                mode === opt.id ? "border-primary bg-primary/5 text-primary" : "hover:bg-elevated",
              )}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="card p-5">
        <h3 className="mb-1 text-[15px] font-semibold">Session</h3>
        <p className="mb-3 text-[12.5px] text-muted-foreground">Sign out of your TaskFlow account</p>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              toast.error(error.message);
              return;
            }
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </section>
    </div>
  );
};