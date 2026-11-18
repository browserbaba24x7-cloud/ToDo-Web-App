import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  X,
  Pause,
  Clock3,
  Maximize2,
  Minimize2,
  Pencil,
  PictureInPicture2,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";

interface FocusTimer {
  id: string;
  name: string;
  durationMinutes: number;
}

interface DocumentPictureInPictureApi {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

const STORAGE_KEY = "taskflow_focus_timers";
const defaultTimers: FocusTimer[] = [
  { id: "focus-3-min", name: "3 min", durationMinutes: 3 },
  { id: "focus-5-min", name: "5 min", durationMinutes: 5 },
  { id: "focus-10-min", name: "10 min", durationMinutes: 10 },
];

const isFocusTimer = (value: unknown): value is FocusTimer => {
  if (!value || typeof value !== "object") return false;
  const timer = value as Record<string, unknown>;
  return (
    typeof timer.id === "string" &&
    typeof timer.name === "string" &&
    timer.name.trim().length > 0 &&
    typeof timer.durationMinutes === "number" &&
    Number.isInteger(timer.durationMinutes) &&
    timer.durationMinutes >= 1 &&
    timer.durationMinutes <= 180
  );
};

const loadTimers = (): FocusTimer[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultTimers;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(isFocusTimer)) return parsed;
    console.error("Saved focus timers have an invalid format.");
  } catch (error) {
    console.error("Could not read saved focus timers.", error);
  }
  return defaultTimers;
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${remainder}`;
};

const FocusTimerCard = ({
  timer,
  secondsLeft,
  isRunning,
  isPinned,
  isEditing,
  onEdit,
  onDelete,
  onToggle,
  onReset,
  onPin,
}: {
  timer: FocusTimer;
  secondsLeft: number;
  isRunning: boolean;
  isPinned: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onReset: () => void;
  onPin: () => void;
}) => {
  const totalSeconds = timer.durationMinutes * 60;
  const cardRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const progress = totalSeconds ? (secondsLeft / totalSeconds) * 100 : 0;
  const angle = `${progress * 3.6}deg`;

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === cardRef.current);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === cardRef.current) {
        await document.exitFullscreen();
      } else {
        await cardRef.current?.requestFullscreen();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the full-screen timer.");
    }
  };

  return (
    <article ref={cardRef} className="card focus-timer-card flex min-h-[310px] flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="focus-timer-name min-w-0 flex-1 truncate rounded text-left text-sm font-bold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Edit ${timer.name} name and duration`}
        >
          {timer.name}
        </button>
        {isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full p-2 text-muted-foreground hover:bg-elevated hover:text-foreground"
              aria-label={`Edit ${timer.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full p-2 text-danger-foreground hover:bg-danger/20"
              aria-label={`Delete ${timer.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-full p-2 text-muted-foreground hover:bg-elevated hover:text-foreground"
              aria-label={isFullscreen ? `Exit full screen for ${timer.name}` : `Expand ${timer.name} full screen`}
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onPin}
              className={`rounded-full p-2 transition-colors ${isPinned ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-elevated hover:text-foreground"}`}
              aria-label={isPinned ? `Show ${timer.name} in floating window` : `Pin ${timer.name} on top`}
              title={isPinned ? "Show floating timer" : "Keep timer on top"}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <button
          type="button"
          onClick={onEdit}
          className="focus-timer-ring grid h-48 w-48 place-items-center rounded-full p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{
            background: `conic-gradient(hsl(var(--primary)) 0deg ${angle}, hsl(var(--elevated)) ${angle} 360deg)`,
          }}
          aria-label={`Edit ${timer.name} duration and name`}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-surface shadow-clay-inset">
            <p
              className="focus-timer-time font-mono text-[clamp(1.7rem,5vw,2.4rem)] font-bold tabular-nums tracking-tight"
              role="timer"
              aria-label={`${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={isEditing}
          onClick={onToggle}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-clay disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isRunning ? `Pause ${timer.name}` : `Start ${timer.name}`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          type="button"
          disabled={isEditing}
          onClick={onReset}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-muted-foreground hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Reset ${timer.name}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
};

export const FocusPage = () => {
  const navigate = useNavigate();
  const [timers, setTimers] = useState<FocusTimer[]>(loadTimers);
  const [remainingById, setRemainingById] = useState<Record<string, number>>(() =>
    Object.fromEntries(loadTimers().map((timer) => [timer.id, timer.durationMinutes * 60])),
  );
  const [runningIds, setRunningIds] = useState<string[]>([]);
  const [endAtById, setEndAtById] = useState<Record<string, number>>({});
  const [pinnedTimerId, setPinnedTimerId] = useState<string>();
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<FocusTimer>();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("25");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (runningIds.length === 0) return;
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setRemainingById((current) => {
        let changed = false;
        const next = { ...current };
        runningIds.forEach((id) => {
          const endAt = endAtById[id];
          if (endAt === undefined) return;
          const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
          if (next[id] !== remaining) {
            next[id] = remaining;
            changed = true;
          }
        });
        return changed ? next : current;
      });
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [runningIds, endAtById]);

  useEffect(() => {
    const completedIds = runningIds.filter((id) => remainingById[id] === 0);
    if (completedIds.length === 0) return;
    setRunningIds((current) => current.filter((id) => !completedIds.includes(id)));
    setEndAtById((current) => {
      const next = { ...current };
      completedIds.forEach((id) => delete next[id]);
      return next;
    });
    completedIds.forEach((id) => {
      const timer = timers.find((item) => item.id === id);
      if (timer) toast.success(`${timer.name} focus session complete.`);
    });
  }, [remainingById, runningIds, timers]);

  useEffect(() => {
    if (!pipWindow) return;
    const handlePageHide = () => {
      setPipWindow(null);
      setPinnedTimerId(undefined);
    };
    pipWindow.addEventListener("pagehide", handlePageHide, { once: true });
    return () => {
      pipWindow.removeEventListener("pagehide", handlePageHide);
      if (!pipWindow.closed) pipWindow.close();
    };
  }, [pipWindow]);

  useEffect(() => {
    if (!pipWindow || !pinnedTimerId) return;
    const timer = timers.find((item) => item.id === pinnedTimerId);
    if (timer) pipWindow.document.title = `${timer.name} · TaskFlow Focus`;
  }, [pipWindow, pinnedTimerId, timers]);

  const getSecondsLeft = (timer: FocusTimer) => {
    const endAt = endAtById[timer.id];
    if (runningIds.includes(timer.id) && endAt !== undefined) {
      return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    }
    return remainingById[timer.id] ?? timer.durationMinutes * 60;
  };

  const toggleTimer = (timer: FocusTimer) => {
    if (runningIds.includes(timer.id)) {
      const secondsLeft = getSecondsLeft(timer);
      setRunningIds((current) => current.filter((id) => id !== timer.id));
      setEndAtById((current) => {
        const next = { ...current };
        delete next[timer.id];
        return next;
      });
      setRemainingById((current) => ({ ...current, [timer.id]: secondsLeft }));
      return;
    }

    const secondsLeft = getSecondsLeft(timer);
    const nextSecondsLeft = secondsLeft || timer.durationMinutes * 60;
    setRemainingById((current) => ({ ...current, [timer.id]: nextSecondsLeft }));
    setEndAtById((current) => ({ ...current, [timer.id]: Date.now() + nextSecondsLeft * 1000 }));
    setRunningIds((current) => [...current, timer.id]);
  };

  const resetTimer = (timer: FocusTimer) => {
    setRunningIds((current) => current.filter((id) => id !== timer.id));
    setEndAtById((current) => {
      const next = { ...current };
      delete next[timer.id];
      return next;
    });
    setRemainingById((current) => ({ ...current, [timer.id]: timer.durationMinutes * 60 }));
  };

  const pinTimer = async (timerId: string) => {
    if (pipWindow && !pipWindow.closed) {
      setPinnedTimerId(timerId);
      pipWindow.focus();
      return;
    }

    const pictureInPicture = (window as Window & {
      documentPictureInPicture?: DocumentPictureInPictureApi;
    }).documentPictureInPicture;
    if (!pictureInPicture) {
      toast.error("Floating timers require Picture-in-Picture support in your browser.");
      return;
    }

    try {
      const nextWindow = await pictureInPicture.requestWindow({ width: 360, height: 420 });
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => {
        nextWindow.document.head.appendChild(style.cloneNode(true));
      });
      nextWindow.document.documentElement.className = document.documentElement.className;
      nextWindow.document.body.className = document.body.className;
      nextWindow.document.title = "TaskFlow Focus";
      setPinnedTimerId(timerId);
      setPipWindow(nextWindow);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the floating timer.");
    }
  };

  const closePinnedTimer = () => {
    if (pipWindow && !pipWindow.closed) pipWindow.close();
    setPipWindow(null);
    setPinnedTimerId(undefined);
  };

  const pinnedTimer = timers.find((timer) => timer.id === pinnedTimerId);
  const pinnedSecondsLeft = pinnedTimer ? getSecondsLeft(pinnedTimer) : 0;
  const pinnedIsRunning = Boolean(pinnedTimer && runningIds.includes(pinnedTimer.id));

  const saveTimers = (nextTimers: FocusTimer[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTimers));
      setTimers(nextTimers);
      setRemainingById((current) =>
        Object.fromEntries(
          nextTimers.map((timer) => {
            const previousTimer = timers.find((item) => item.id === timer.id);
            const keepRemaining =
              previousTimer?.durationMinutes === timer.durationMinutes &&
              current[timer.id] !== undefined;
            return [
              timer.id,
              keepRemaining ? current[timer.id] : timer.durationMinutes * 60,
            ];
          }),
        ),
      );
      setRunningIds((current) =>
        current.filter((id) => {
          const previousTimer = timers.find((timer) => timer.id === id);
          const nextTimer = nextTimers.find((timer) => timer.id === id);
          return previousTimer && nextTimer &&
            previousTimer.durationMinutes === nextTimer.durationMinutes;
        }),
      );
      setEndAtById((current) => {
        const next = { ...current };
        Object.keys(next).forEach((id) => {
          const previousTimer = timers.find((timer) => timer.id === id);
          const nextTimer = nextTimers.find((timer) => timer.id === id);
          if (!previousTimer || !nextTimer ||
            previousTimer.durationMinutes !== nextTimer.durationMinutes) {
            delete next[id];
          }
        });
        return next;
      });
      if (pinnedTimerId && !nextTimers.some((timer) => timer.id === pinnedTimerId)) {
        closePinnedTimer();
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your focus timers.");
      return false;
    }
  };

  const openNewTimer = () => {
    setEditingTimer(undefined);
    setName("");
    setDuration("25");
    setFormError("");
    setDialogOpen(true);
  };

  const openEditTimer = (timer: FocusTimer) => {
    setEditingTimer(timer);
    setName(timer.name);
    setDuration(String(timer.durationMinutes));
    setFormError("");
    setDialogOpen(true);
  };

  const saveTimer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const durationMinutes = Number(duration);
    if (!cleanName) {
      setFormError("Enter a name for this focus timer.");
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
      setFormError("Duration must be between 1 and 180 minutes.");
      return;
    }

    const nextTimer = {
      id: editingTimer?.id ?? generateId(),
      name: cleanName,
      durationMinutes,
    };
    const nextTimers = editingTimer
      ? timers.map((timer) => timer.id === editingTimer.id ? nextTimer : timer)
      : [...timers, nextTimer];

    if (saveTimers(nextTimers)) {
      setDialogOpen(false);
      toast.success(editingTimer ? "Focus timer updated." : "Focus timer added.");
    }
  };

  const deleteTimer = (timer: FocusTimer) => {
    if (saveTimers(timers.filter((item) => item.id !== timer.id))) {
      if (editingTimer?.id === timer.id) setDialogOpen(false);
      toast.success(`${timer.name} removed.`);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col bg-background px-5 py-5 md:px-8 md:py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Timer className="h-5 w-5 text-primary" />
          TaskFlow Focus
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Exit focus
        </Button>
      </header>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Focus timers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create timers for different focus sessions. Each timer runs independently.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isEditing ? "secondary" : "outline"}
            onClick={() => setIsEditing((editing) => !editing)}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {isEditing ? "Done" : "Customize"}
          </Button>
          <Button type="button" onClick={openNewTimer}>
            <Plus className="h-4 w-4" /> Add timer
          </Button>
        </div>
      </div>

      {timers.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {timers.map((timer) => (
            <FocusTimerCard
              key={`${timer.id}:${timer.durationMinutes}`}
              timer={timer}
              secondsLeft={getSecondsLeft(timer)}
              isRunning={runningIds.includes(timer.id)}
              isPinned={pinnedTimerId === timer.id}
              isEditing={isEditing}
              onEdit={() => openEditTimer(timer)}
              onDelete={() => deleteTimer(timer)}
              onToggle={() => toggleTimer(timer)}
              onReset={() => resetTimer(timer)}
              onPin={() => pinTimer(timer.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-clay-lg border-2 border-dashed p-8 text-center">
          <Clock3 className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-semibold">No focus timers yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add a timer to build your focus page.</p>
          <Button className="mt-4" onClick={openNewTimer}>
            <Plus className="h-4 w-4" /> Add timer
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editingTimer ? "Edit focus timer" : "Add focus timer"}
          description="Choose a name and a session length between 1 and 180 minutes."
        >
          <form onSubmit={saveTimer} className="space-y-4">
            <div>
              <label htmlFor="timer-name" className="mb-1.5 block text-[13px] font-medium">Timer name</label>
              <Input
                id="timer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                placeholder="e.g., Deep work"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="timer-duration" className="mb-1.5 block text-[13px] font-medium">Duration in minutes</label>
              <Input
                id="timer-duration"
                className="number-input-no-spinner"
                type="number"
                min={1}
                max={180}
                step={1}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            {formError && <p role="alert" className="text-[12px] text-danger-foreground">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              {editingTimer && (
                <Button
                  type="button"
                  variant="danger"
                  className="mr-auto"
                  onClick={() => deleteTimer(editingTimer)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingTimer ? "Save timer" : "Add timer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {pipWindow && pinnedTimer && createPortal(
        <main className="flex min-h-screen flex-col items-center justify-between bg-background p-4 text-foreground">
          <header className="flex w-full items-center justify-between gap-2">
            <span className="truncate text-sm font-bold">{pinnedTimer.name}</span>
            <button
              type="button"
              onClick={closePinnedTimer}
              className="rounded-full p-2 text-muted-foreground hover:bg-elevated hover:text-foreground"
              aria-label="Close floating timer"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="grid flex-1 place-items-center">
            <div
              className="grid h-64 w-64 place-items-center rounded-full p-3"
              style={{
                background: `conic-gradient(hsl(var(--primary)) 0deg ${(pinnedSecondsLeft / (pinnedTimer.durationMinutes * 60)) * 360}deg, hsl(var(--elevated)) ${(pinnedSecondsLeft / (pinnedTimer.durationMinutes * 60)) * 360}deg 360deg)`,
              }}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-surface shadow-clay-inset">
                <p className="font-mono text-4xl font-bold tabular-nums tracking-tight" role="timer">
                  {formatTime(pinnedSecondsLeft)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pb-2">
            <button
              type="button"
              onClick={() => toggleTimer(pinnedTimer)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-clay"
              aria-label={pinnedIsRunning ? "Pause timer" : "Start timer"}
            >
              {pinnedIsRunning ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => resetTimer(pinnedTimer)}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-muted-foreground hover:bg-elevated"
              aria-label="Reset timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </main>,
        pipWindow.document.body,
      )}
    </div>
  );
};
