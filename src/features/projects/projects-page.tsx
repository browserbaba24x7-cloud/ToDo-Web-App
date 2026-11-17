import { useState } from "react";
import { Plus, FolderKanban, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useProjects } from "@/lib/store/project-store";
import { useTasks } from "@/lib/store/task-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export const ProjectsPage = () => {
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight">Projects</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Create project
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="pl-8" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to group related tasks." action={{ label: "Create project", onClick: () => setOpen(true) }} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const pTasks = tasks.filter((t) => t.projectId === p.id);
            const done = pTasks.filter((t) => t.status === "done").length;
            const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
            return (
              <Link key={p.id} to={`/app/projects/${p.id}`} className="card group p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="sidebar-project-dot h-3.5 w-3.5 rounded-full" style={{ backgroundColor: p.color, color: p.color }} />
                  <h3 className="flex-1 truncate text-[14px] font-semibold">{p.name}</h3>
                </div>
                {p.description && <p className="line-clamp-2 mb-3 text-[12.5px] text-muted-foreground">{p.description}</p>}
                <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>{done}/{pTasks.length} tasks</span>
                  <span className="font-medium text-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-1.5" />
              </Link>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};