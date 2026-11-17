import { useState } from "react";
import { Check, Trash2, Pencil, Calendar, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { formatDueDate, cn, priorityConfig } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUpdateTask, useDeleteTask } from "@/lib/store/task-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useProjects } from "@/lib/store/project-store";
import { toast } from "sonner";
import type { Task } from "@/lib/types";
import { isPast, isToday } from "date-fns";

export const TaskRow = ({ task }: { task: Task }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
  });
  const update = useUpdateTask();
  const del = useDeleteTask();
  const { setTaskModalOpen, setEditTaskId } = useUIStore();
  const { data: projects = [] } = useProjects();
  const project = projects.find((p) => p.id === task.projectId);
  const isDone = task.status === "done";
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !isDone;
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const toggleDone = () => {
    update.mutate(
      { id: task.id, patch: { status: isDone ? "todo" : "done", completedAt: isDone ? undefined : new Date().toISOString() } },
      {
        onSuccess: () => toast.success(isDone ? "Task reopened" : "Task completed"),
        onError: (error) => toast.error(error.message || "Could not update task."),
      },
    );
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-start gap-3 rounded-clay border-2 bg-surface px-4 py-3 shadow-clay transition-all duration-150 hover:-translate-y-0.5 hover:shadow-clay-hover",
          isDragging && "z-10 opacity-0",
        )}
      >
        <button
          onClick={toggleDone}
          aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
          className={cn(
            "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            isDone
              ? "animate-checkbox-pop border-primary bg-primary text-primary-foreground shadow-clay"
              : "border-border bg-surface shadow-clay-inset hover:border-primary",
          )}
        >
          {isDone && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("truncate text-[14px] font-medium", isDone && "text-muted-foreground line-through")}>
              {task.title}
            </p>
            <PriorityBadge priority={task.priority} />
          </div>
          {task.description && (
            <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue && "text-danger-foreground")}>
                <Calendar className="h-3 w-3" /> {formatDueDate(task.dueDate)}
              </span>
            )}
            {project && (
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            {task.labels.map((l) => (
              <span key={l} className="rounded-full bg-elevated px-2.5 py-1 shadow-clay-inset">{l}</span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="touch-none cursor-grab rounded p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground active:cursor-grabbing"
            aria-label="Drag task to a project or Inbox"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setEditTaskId(task.id);
              setTaskModalOpen(true);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-full p-2 text-muted-foreground hover:bg-danger/20 hover:text-danger-foreground hover:shadow-clay"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted.`}
        onConfirm={() => {
          del.mutate(task.id, {
            onSuccess: () => toast.success("Task deleted"),
            onError: (error) => toast.error(error.message || "Could not delete task."),
          });
        }}
      />
    </>
  );
};