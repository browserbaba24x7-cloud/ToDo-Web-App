import { useMemo, useState } from "react";
import { Plus, Inbox as InboxIcon, Search } from "lucide-react";
import { useTasks } from "@/lib/store/task-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/lib/types";

const priorities: (Priority | "all")[] = ["all", "urgent", "high", "medium", "low"];
const statuses: (TaskStatus | "all")[] = ["all", "todo", "in_progress", "done"];

export const InboxPage = () => {
  const { data: tasks = [] } = useTasks();
  const { setTaskModalOpen, setEditTaskId } = useUIStore();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<TaskStatus | "all">("all");

  const inboxTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.projectId)
      .filter((t) => (priority === "all" ? true : t.priority === priority))
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, priority, status, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight">Inbox</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{inboxTasks.length} task{inboxTasks.length !== 1 ? "s" : ""} without a project</p>
        </div>
        <Button size="sm" onClick={() => { setEditTaskId(undefined); setTaskModalOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inbox…" className="pl-8" />
        </div>
        <div className="flex gap-1 rounded-md border bg-surface p-0.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn("rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors", status === s ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {s === "in_progress" ? "In Progress" : s}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
          {priorities.map((p) => (
            <option key={p} value={p}>{p === "all" ? "All priorities" : p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {inboxTasks.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Inbox zero"
          description="No tasks match your filters. Add a new task or clear your filters."
          action={{ label: "Add task", onClick: () => { setEditTaskId(undefined); setTaskModalOpen(true); } }}
        />
      ) : (
        <div className="space-y-2">
          {inboxTasks.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
};