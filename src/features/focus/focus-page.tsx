import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Pause,
  Clock3,
  Pencil,
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
  isEditing,
  onEdit,
  onDelete,
}: {
  timer: FocusTimer;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const totalSeconds = timer.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const timeoutId = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setIsRunning(false);
        toast.success(`${timer.name} focus session complete.`);
      } else {
        setSecondsLeft((remaining) => remaining - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [isRunning, secondsLeft, timer.name]);

  const progress = totalSeconds ? (secondsLeft / totalSeconds) * 100 : 0;
  const angle = `${progress * 3.6}deg`;

  return (
    <article className="card flex min-h-[310px] flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{timer.name}</h2>
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
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <div
          className="grid h-48 w-48 place-items-center rounded-full p-3"
          style={{
            background: `conic-gradient(hsl(var(--primary)) 0deg ${angle}, hsl(var(--elevated)) ${angle} 360deg)`,
          }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-surface shadow-clay-inset">
            <p
              className="font-mono text-[clamp(1.7rem,5vw,2.4rem)] font-bold tabular-nums tracking-tight"
              role="timer"
              aria-label={`${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={isEditing}
          onClick={() => {
            if (secondsLeft === 0) setSecondsLeft(totalSeconds);
            setIsRunning((running) => !running);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-clay disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isRunning ? `Pause ${timer.name}` : `Start ${timer.name}`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          type="button"
          disabled={isEditing}
          onClick={() => {
            setIsRunning(false);
            setSecondsLeft(totalSeconds);
          }}
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
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<FocusTimer>();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("25");
  const [formError, setFormError] = useState("");

  const saveTimers = (nextTimers: FocusTimer[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTimers));
      setTimers(nextTimers);
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
              isEditing={isEditing}
              onEdit={() => openEditTimer(timer)}
              onDelete={() => deleteTimer(timer)}
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
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingTimer ? "Save timer" : "Add timer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
