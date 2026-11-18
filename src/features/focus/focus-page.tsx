import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Pause, Play, RotateCcw, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, useUpdateTask } from "@/lib/store/task-store";
import { toast } from "sonner";

type FocusMode = "task" | "pomodoro";
type TimerPhase = "focus" | "break";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export const FocusPage = () => {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const updateTask = useUpdateTask();
  const availableTasks = tasks.filter((task) => task.status !== "done");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const selectedTask = availableTasks.find((task) => task.id === selectedTaskId);

  useEffect(() => {
    if (!isRunning) return;
    const timeoutId = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setIsRunning(false);
        const nextPhase = phase === "focus" ? "break" : "focus";
        setPhase(nextPhase);
        setSecondsLeft(nextPhase === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
        toast.success(phase === "focus" ? "Focus session complete. Take a break!" : "Break complete. Ready to focus?");
      } else {
        setSecondsLeft((remaining) => remaining - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [isRunning, secondsLeft, phase]);

  const resetTimer = () => {
    setIsRunning(false);
    setPhase("focus");
    setSecondsLeft(FOCUS_SECONDS);
  };

  const completeTask = () => {
    if (!selectedTask) return;
    updateTask.mutate(
      {
        id: selectedTask.id,
        patch: { status: "done", completedAt: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          toast.success("Task completed");
          setSelectedTaskId("");
          resetTimer();
        },
        onError: (error) => toast.error(error.message || "Could not complete task."),
      },
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col bg-background px-5 py-5 md:px-10 md:py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Target className="h-5 w-5 text-primary" />
          TaskFlow Focus
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Exit focus
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Make space to focus</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose one task and give it your attention.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-clay border-2 bg-elevated p-1.5">
          <button
            type="button"
            onClick={() => { setMode("task"); setIsRunning(false); }}
            className={`rounded-clay px-3 py-2.5 text-sm font-semibold ${mode === "task" ? "bg-surface text-foreground shadow-clay" : "text-muted-foreground"}`}
            aria-pressed={mode === "task"}
          >
            Task only
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("pomodoro");
              setIsRunning(false);
              setPhase("focus");
              setSecondsLeft(FOCUS_SECONDS);
            }}
            className={`rounded-clay px-3 py-2.5 text-sm font-semibold ${mode === "pomodoro" ? "bg-surface text-foreground shadow-clay" : "text-muted-foreground"}`}
            aria-pressed={mode === "pomodoro"}
          >
            Pomodoro timer
          </button>
        </div>

        <section className="card space-y-5 p-5 md:p-7">
          <div>
            <label htmlFor="focus-task" className="mb-2 block text-sm font-semibold">Focus task</label>
            <select
              id="focus-task"
              className="input"
              value={selectedTaskId}
              onChange={(event) => {
                setSelectedTaskId(event.target.value);
                setIsRunning(false);
                setPhase("focus");
                setSecondsLeft(FOCUS_SECONDS);
              }}
            >
              <option value="">Choose a task…</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>

          {selectedTask ? (
            <div className="rounded-clay border-2 bg-elevated/60 p-4">
              <p className="text-lg font-bold">{selectedTask.title}</p>
              {selectedTask.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{selectedTask.description}</p>
              )}
            </div>
          ) : (
            <p className="rounded-clay border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
              {availableTasks.length ? "Select a task to begin." : "No unfinished tasks. Add one to start a focus session."}
            </p>
          )}

          {mode === "pomodoro" && (
            <div className="py-2 text-center">
              <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                <Timer className="h-4 w-4" />
                {phase === "focus" ? "Focus session · 25 minutes" : "Break · 5 minutes"}
              </div>
              <p className="font-mono text-6xl font-bold tabular-nums tracking-tight" role="timer" aria-label={`${formatTime(secondsLeft)} remaining`}>
                {formatTime(secondsLeft)}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button onClick={() => setIsRunning((running) => !running)} disabled={!selectedTask}>
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? "Pause" : phase === "focus" ? "Start focus" : "Start break"}
                </Button>
                <Button variant="secondary" onClick={resetTimer}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t pt-4">
            <Button onClick={completeTask} disabled={!selectedTask || updateTask.isPending}>
              <Check className="h-4 w-4" />
              {updateTask.isPending ? "Completing…" : "Complete task"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
