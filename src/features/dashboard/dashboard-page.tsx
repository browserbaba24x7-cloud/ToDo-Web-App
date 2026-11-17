import { Plus, ListTodo, CheckCircle2, Clock, AlertTriangle, ArrowRight, Inbox as InboxIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTasks } from "@/lib/store/task-store";
import { useProjects } from "@/lib/store/project-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { isToday, isPast } from "date-fns";
import { useAuth } from "@/lib/auth/auth-context";

const StatCard = ({ label, value, icon: Icon, accent }: any) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 shadow-clay">
        <Icon className={cn("h-5 w-5", accent)} />
      </span>
    </div>
    <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
  </div>
);

export const DashboardPage = () => {
  const { session } = useAuth();
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { setTaskModalOpen, setEditTaskId } = useUIStore();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "done").length;
  const dailyProgress = total ? Math.round((completed / total) * 100) : 0;

  const todaysTasks = tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "done").slice(0, 5);
  const upcoming = tasks
    .filter((t) => t.dueDate && !isPast(new Date(t.dueDate)) && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 4);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const accountName =
    (session?.user.user_metadata.full_name as string | undefined) ||
    (session?.user.user_metadata.name as string | undefined) ||
    session?.user.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight">{greeting}, {accountName}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · You have {pending} task{pending !== 1 ? "s" : ""} remaining
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditTaskId(undefined); setTaskModalOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" /> Create task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tasks" value={total} icon={ListTodo} accent="text-muted-foreground" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="text-success-foreground" />
        <StatCard label="Pending" value={pending} icon={Clock} accent="text-primary" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} accent="text-danger-foreground" />
      </div>

      {/* Progress */}
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium">Daily completion</span>
          <span className="text-[13px] font-semibold text-primary">{dailyProgress}%</span>
        </div>
        <Progress value={dailyProgress} />
        <p className="mt-2 text-[12px] text-muted-foreground">
          {completed} of {total} tasks completed
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Today's tasks</h3>
            <Link to="/app/today" className="text-[12px] text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {todaysTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All clear for today"
                description="You have no tasks scheduled for today. Enjoy the focus time."
                action={{ label: "Add a task", onClick: () => { setEditTaskId(undefined); setTaskModalOpen(true); } }}
              />
            ) : (
              todaysTasks.map((t) => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Upcoming deadlines</h3>
            <div className="card divide-y">
              {upcoming.length === 0 ? (
                <div className="p-4 text-[13px] text-muted-foreground">No upcoming deadlines.</div>
              ) : (
                upcoming.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 p-3">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="min-w-0 flex-1 truncate text-[13px]">{t.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {format(new Date(t.dueDate!), "MMM d")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">Recent projects</h3>
              <Link to="/app/projects" className="text-[12px] text-primary hover:underline">All →</Link>
            </div>
            <div className="space-y-2">
              {projects.slice(0, 3).map((p) => {
                const pTasks = tasks.filter((t) => t.projectId === p.id);
                const pDone = pTasks.filter((t) => t.status === "done").length;
                const pct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
                return (
                  <Link key={p.id} to={`/app/projects/${p.id}`} className="card block p-4">
                    <div className="flex items-center gap-2">
                      <span className="sidebar-project-dot h-3.5 w-3.5 rounded-full" style={{ backgroundColor: p.color, color: p.color }} />
                      <span className="flex-1 truncate text-[13px] font-medium">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};