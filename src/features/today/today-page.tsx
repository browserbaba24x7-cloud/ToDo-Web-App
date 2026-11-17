import { useMemo } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { useTasks } from "@/lib/store/task-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";

export const TodayPage = () => {
  const { data: tasks = [] } = useTasks();
  const { setTaskModalOpen, setEditTaskId } = useUIStore();

  const { todays, overdue, doneCount } = useMemo(() => {
    const todays = tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "done");
    const overdue = tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "done");
    const doneCount = tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status === "done").length;
    return { todays, overdue, doneCount };
  }, [tasks]);

  const total = todays.length + doneCount;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight">Today</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <Button size="sm" onClick={() => { setEditTaskId(undefined); setTaskModalOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Quick add
        </Button>
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium">Daily progress</span>
          <span className="text-[13px] font-semibold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} />
        <p className="mt-2 text-[12px] text-muted-foreground">
          {doneCount} of {total} tasks completed today
        </p>
      </div>

      {overdue.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-danger-foreground">
            Overdue <span className="rounded-full bg-danger/10 px-1.5 text-[11px]">{overdue.length}</span>
          </h3>
          <div className="space-y-2">{overdue.map((t) => <TaskRow key={t.id} task={t} />)}</div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Scheduled for today</h3>
        {todays.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing scheduled"
            description="Enjoy a clear day, or add a task to get started."
            action={{ label: "Add task", onClick: () => { setEditTaskId(undefined); setTaskModalOpen(true); } }}
          />
        ) : (
          <div className="space-y-2">{todays.map((t) => <TaskRow key={t.id} task={t} />)}</div>
        )}
      </div>
    </div>
  );
};