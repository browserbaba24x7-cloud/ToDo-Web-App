import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Check,
  Copy,
  Database,
  Download,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useThemeStore } from "@/lib/store/theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/auth-context";
import { taskNotificationSettingsEvent } from "@/lib/hooks/use-task-reminders";
import { useTasks } from "@/lib/store/task-store";
import { useProjects } from "@/lib/store/project-store";
import type { ThemeMode } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getDeviceSessionErrorMessage,
  listDeviceSessions,
  registerDeviceSession,
  type DeviceSession,
} from "@/lib/services/device-session-service";

const themeOptions: { id: ThemeMode; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const SectionHeading = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-foreground shadow-clay">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <h3 className="text-[15px] font-bold">{title}</h3>
      {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  </div>
);

export const SettingsPage = () => {
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: tasks, isLoading: tasksLoading, isError: tasksError, error: taskLoadError } = useTasks();
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectLoadError,
  } = useProjects();
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState("");
  const [currentDeviceSessionId, setCurrentDeviceSessionId] = useState("");
  const [signOutOthersOpen, setSignOutOthersOpen] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("taskflow_notifications_enabled") === "true",
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => ("Notification" in window ? Notification.permission : "unsupported"));
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
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Not available";
  const language = navigator.language || "Not available";
  const lastSignIn = session?.user.last_sign_in_at
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(session.user.last_sign_in_at),
      )
    : "Not available";

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setDevicesLoading(false);
      return;
    }

    let active = true;
    const loadDevices = async () => {
      try {
        const { sessionId } = await registerDeviceSession(session);
        const sessions = await listDeviceSessions();
        if (active) {
          setCurrentDeviceSessionId(sessionId);
          setDeviceSessions(sessions);
          setDevicesError("");
        }
      } catch (error) {
        if (active) {
          setDevicesError(getDeviceSessionErrorMessage(error));
        }
      } finally {
        if (active) setDevicesLoading(false);
      }
    };

    void loadDevices();
    const interval = window.setInterval(() => {
      void loadDevices();
    }, 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [session?.access_token, session?.user.id]);

  const exportBackup = () => {
    if (tasksLoading || projectsLoading) {
      toast.info("Your data is still loading. Try again in a moment.");
      return;
    }
    if (tasksError || projectsError) {
      toast.error(
        taskLoadError?.message || projectLoadError?.message || "Could not load your data for export.",
      );
      return;
    }
    if (!tasks || !projects) {
      toast.error("Your data is not available for export yet.");
      return;
    }

    try {
      const backup = {
        format: "taskflow-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        account: { id: session?.user.id, email },
        tasks,
        projects,
      };
      const file = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Your TaskFlow backup has been downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export your data.");
    }
  };

  const copyAccountId = async () => {
    if (!session?.user.id) {
      toast.error("Your account ID is unavailable.");
      return;
    }
    try {
      await navigator.clipboard.writeText(session.user.id);
      toast.success("Account ID copied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy the account ID.");
    }
  };

  const signOutOtherDevices = async () => {
    setSigningOutOthers(true);
    try {
      const { error: revokeError } = await supabase.rpc("revoke_other_device_sessions");
      if (revokeError) {
        toast.error(revokeError.message);
        return;
      }

      setDeviceSessions((current) =>
        current.map((device) =>
          device.session_id === currentDeviceSessionId
            ? device
            : { ...device, revoked_at: device.revoked_at || new Date().toISOString() },
        ),
      );

      const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
      if (signOutError) {
        toast.error(
          `Other devices can no longer access TaskFlow data, but their refresh tokens could not be revoked: ${signOutError.message}`,
        );
        return;
      }

      toast.success("All other devices have been signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out other devices.");
    } finally {
      setSigningOutOthers(false);
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      localStorage.setItem("taskflow_notifications_enabled", "false");
      setNotificationsEnabled(false);
      window.dispatchEvent(new Event(taskNotificationSettingsEvent));
      toast.info("Task notifications turned off.");
      return;
    }

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast.error("This browser does not support notifications.");
      return;
    }

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request notification permission.");
      return;
    }
    setNotificationPermission(permission);
    if (permission !== "granted") {
      toast.error(
        permission === "denied"
          ? "Notifications are blocked in your browser settings."
          : "Notification permission was not granted.",
      );
      return;
    }

    localStorage.setItem("taskflow_notifications_enabled", "true");
    setNotificationsEnabled(true);
    window.dispatchEvent(new Event(taskNotificationSettingsEvent));
    toast.success("Task notifications turned on.");
  };

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
      setPasswordEditing(false);
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
    <div className="mx-auto max-w-5xl space-y-5 pb-8 sm:space-y-6">
      <header className="relative isolate overflow-hidden rounded-clay-xl border-2 border-border bg-gradient-to-br from-surface via-surface to-primary/15 p-5 shadow-clay sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-clay sm:flex">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Personal workspace
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[30px]">
                Make TaskFlow yours
              </h2>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                Fine-tune your account, security, reminders, and the way you work.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/15 px-3 py-2 text-xs font-bold text-success-foreground">
            <Check className="h-4 w-4" />
            Theme and reminder preferences save automatically
          </div>
        </div>
      </header>

      <section className="card space-y-5 p-5 sm:p-6">
        <SectionHeading
          icon={ShieldCheck}
          title="Profile & security"
          description="Manage your account details and password in one place."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-elevated/40 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-clay">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{profileName}</p>
                <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (profileEditing) {
                    setProfileName(accountName);
                    setProfileEmail(email);
                    setProfileError("");
                  }
                  setProfileEditing(!profileEditing);
                }}
              >
                {profileEditing ? "Cancel" : "Edit profile"}
              </Button>
            </div>
            {profileEditing && (
              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label htmlFor="profileFullName" className="mb-1.5 block text-[13px] font-semibold">Full name</label>
                  <Input
                    id="profileFullName"
                    name="fullName"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="profileEmail" className="mb-1.5 block text-[13px] font-semibold">Email</label>
                  <Input
                    id="profileEmail"
                    name="email"
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    required
                  />
                </div>
                {profileError && (
                  <p role="alert" className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">
                    {profileError}
                  </p>
                )}
                <Button type="submit" size="sm" disabled={profileSaving}>
                  {profileSaving ? "Saving…" : "Save changes"}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-elevated/40 p-4">
            <div>
              <h4 className="text-sm font-bold">Password</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Change your password using your current credentials.
              </p>
            </div>
            {!passwordEditing ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setPasswordEditing(true)}>
                Change password
              </Button>
            ) : (
              <form onSubmit={updatePassword} className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className="mb-1.5 block text-[13px] font-semibold">Current password</label>
                  <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block text-[13px] font-semibold">New password</label>
                  <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={6} required />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-semibold">Confirm new password</label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required />
                </div>
                {passwordError && (
                  <p role="alert" className="rounded-clay bg-danger/25 px-3 py-2 text-[12px] text-danger-foreground shadow-clay-inset">
                    {passwordError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={passwordSaving}>
                    {passwordSaving ? "Updating…" : "Update password"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPasswordEditing(false);
                      setPasswordError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-5 p-5 sm:p-6">
          <SectionHeading
            icon={Sparkles}
            title="Appearance"
            description="Choose a theme that feels comfortable on this device."
          />
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-[13px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  mode === id
                    ? "border-primary bg-primary/15 text-foreground shadow-clay"
                    : "border-border bg-surface text-muted-foreground hover:bg-elevated",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {mode === id && <span className="text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">Selected</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="card space-y-5 p-5 sm:p-6">
          <SectionHeading
            icon={Bell}
            title="Task reminders"
            description="Get browser notifications for task due dates and custom reminders."
          />
          <div className="rounded-2xl border border-border bg-elevated/60 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/15 p-2 text-primary-foreground">
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {notificationPermission === "unsupported"
                    ? "Browser notifications unavailable"
                    : notificationPermission === "denied"
                      ? "Permission blocked in browser"
                      : notificationsEnabled
                        ? "Reminders are enabled"
                        : "Reminders are turned off"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Due-date reminders arrive at 9:00 AM on the due date. TaskFlow must be open to check reminders.
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={notificationsEnabled ? "secondary" : "primary"}
            onClick={toggleNotifications}
            disabled={notificationPermission === "unsupported"}
            aria-pressed={notificationsEnabled}
          >
            {notificationsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {notificationsEnabled ? "Turn off reminders" : "Enable reminders"}
          </Button>
        </section>
      </div>

      <section className="card space-y-5 p-5 sm:p-6">
        <SectionHeading
          icon={Database}
          title="Data & privacy"
          description="Keep a portable copy of your TaskFlow tasks and projects."
        />
        <div className="rounded-2xl border border-border bg-elevated/60 p-4">
          <p className="text-sm font-bold">Personal data backup</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Download a JSON file containing your tasks and projects. The file stays on your device and can be kept as a backup.
          </p>
          <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
            {tasksLoading || projectsLoading
              ? "Loading your data…"
              : tasksError || projectsError
                ? "Data could not be loaded."
                : `${tasks?.length ?? 0} tasks · ${projects?.length ?? 0} projects`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={exportBackup}
          disabled={tasksLoading || projectsLoading}
        >
          <Download className="h-4 w-4" />
          Export data
        </Button>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-5 p-5 sm:p-6">
          <SectionHeading
            icon={Monitor}
            title="Technical details"
            description="Useful environment information for reminders and troubleshooting."
          />
          <dl className="divide-y divide-border rounded-2xl border border-border bg-elevated/50 px-4">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">Network</dt>
              <dd className={cn("inline-flex items-center gap-1.5 text-xs font-bold", isOnline ? "text-success-foreground" : "text-danger-foreground")}>
                {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {isOnline ? "Online" : "Offline"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">Time zone</dt>
              <dd className="max-w-[65%] truncate text-right text-xs font-bold" title={timeZone}>{timeZone}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">Browser language</dt>
              <dd className="text-xs font-bold">{language}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">Last sign-in</dt>
              <dd className="text-right text-xs font-bold">{lastSignIn}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">Account ID</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <code className="max-w-40 truncate rounded-lg bg-surface px-2 py-1 text-[10px]" title={session?.user.id}>
                  {session?.user.id || "Not available"}
                </code>
                <Button type="button" size="icon" variant="ghost" aria-label="Copy account ID" onClick={copyAccountId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </dd>
            </div>
          </dl>
        </section>

        <section className="card space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeading
              icon={Monitor}
              title="Devices & sessions"
              description="Review browsers that have used your TaskFlow account."
            />
            <span className="rounded-full border border-border bg-elevated px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              {deviceSessions.length} known
            </span>
          </div>

          <div className="space-y-2">
            {devicesLoading ? (
              <p role="status" className="rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-xs text-muted-foreground">
                Checking your devices…
              </p>
            ) : devicesError ? (
              <p role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger-foreground">
                <span>Device list unavailable: {devicesError}</span>
                <span className="mt-1 block">
                  Apply <code>20261118020000_enforce_device_session_revocation.sql</code> to the same Supabase project, then reload.
                </span>
              </p>
            ) : deviceSessions.length === 0 ? (
              <p className="rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-xs text-muted-foreground">
                No known devices yet. This device will be recorded automatically.
              </p>
            ) : (
              deviceSessions.map((device) => {
                const isCurrent = device.session_id === currentDeviceSessionId;
                const lastSeen = new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(device.last_seen_at));
                return (
                  <div
                    key={device.session_id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-elevated/50 p-3 sm:p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{device.device_label}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-success-foreground">
                            This device
                          </span>
                        )}
                        {device.revoked_at && (
                          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-danger-foreground">
                            Signed out
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">Last active {lastSeen}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Device labels are approximate and tracking starts after this feature is deployed. “Sign out all other devices” also covers sessions not shown here. Their current access tokens may remain usable until they expire.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={signingOutOthers}
              onClick={() => setSignOutOthersOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              {signingOutOthers ? "Signing out…" : "Sign out all other devices"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const { error } = await supabase.auth.signOut({ scope: "local" });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out this device
            </Button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={signOutOthersOpen}
        onOpenChange={setSignOutOthersOpen}
        title="Sign out all other devices?"
        description="Other TaskFlow sessions will need to sign in again. Their current access tokens may remain usable until they expire. This device stays signed in."
        confirmLabel="Sign out other devices"
        onConfirm={() => void signOutOtherDevices()}
      />
    </div>
  );
};