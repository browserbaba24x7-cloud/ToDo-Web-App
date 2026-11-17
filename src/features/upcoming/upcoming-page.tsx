import { useMemo, useState } from "react";
import { Search, CalendarDays } from "lucide-react";
import { useTasks } from "@/lib/store/task-store";
import { Input } from "@/components/ui/input";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";
import { groupTaskByDate, type UpcomingGroup } from "@/lib/utils";

const groupLabels: Record<UpcomingGroup, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  this_week: "This Week",
  next_week: "Next Week",
  later: "Later",
};

const groupOrder: UpcomingGroup[] = ["overdue", "today", "tomorrow", "this_week", "next_week", "later"];

export const UpcomingPage = () => {
  const { data: tasks = [] } = useTasks();
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const map: Record<UpcomingGroup, typeof tasks> = { overdue: [], today: [], tomorrow: [], this_week: [], next_week: [], later: [] };
    tasks
      .filter((t) => t.status !== "done" && t.dueDate)
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .forEach((t) => map[groupTaskByDate(t.dueDate)].push(t));
    return map;
  }, [tasks, search]);

  const hasAny = Object.values(grouped).some((g) => g.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight">Upcoming</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Plan ahead across the next few weeks</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search upcoming…" className="pl-8" />
      </div>

      {!hasAny ? (
        <EmptyState icon={CalendarDays} title="No upcoming tasks" description="Tasks with due dates will appear here grouped by when they're due." />
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => {
            const list = grouped[group];
            if (list.length === 0) return null;
            return (
              <div key={group}>
                <h3 className={`mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide ${group === "overdue" ? "text-danger-foreground" : "text-muted-foreground"}`}>
                  {groupLabels[group]}
                  <span className="rounded-full bg-elevated px-1.5 text-[11px] text-muted-foreground">{list.length}</span>
                </h3>
                <div className="space-y-2">{list.map((t) => <TaskRow key={t.id} task={t} />)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};