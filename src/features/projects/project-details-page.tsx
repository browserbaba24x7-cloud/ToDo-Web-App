import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, List, LayoutGrid } from "lucide-react";
import { useProjects, useDeleteProject } from "@/lib/store/project-store";
import { useTasks, useUpdateTask } from "@/lib/store/task-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KanbanBoard } from "@/features/projects/kanban-board";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { setTaskModalOpen, setEditTaskId } = useUIStore();
  const delProject = useDeleteProject();
  const updateTask = useUpdateTask();

  const project = projects.find((p) => p.id === projectId);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId).filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [tasks, projectId, search],
  );

  if (!project) {
    return <EmptyState title="Project not found" description="This project may have been deleted." action={{ label: "Back to projects", onClick: () => navigate("/app/projects") }} />;
  }

  const done = tasks.filter((t) => t.projectId === projectId && t.status === "done").length;
  const total = tasks.filter((t) => t.projectId === projectId).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Project header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="sidebar-project-dot h-3.5 w-3.5 rounded-full" style={{ backgroundColor: project.color, color: project.color }} />
            <h2 className="text-[26px] font-semibold tracking-tight">{project.name}</h2>
          </div>
          {project.description && <p className="text-[13px] text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-danger-foreground hover:bg-danger/20"><Trash2 className="h-3.5 w-3.5" /></Button>
          <Button size="sm" onClick={() => { setEditTaskId(undefined); setTaskModalOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add task</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="font-medium">Progress</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
        <Progress value={pct} />
        <div className="mt-2 flex gap-4 text-[12px] text-muted-foreground">
          <span>{done} completed</span>
          <span>{total - done} remaining</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-8" />
        </div>
        <div className="flex rounded-md border bg-surface p-0.5">
          <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium", view === "list" ? "bg-elevated" : "text-muted-foreground")}>
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium", view === "kanban" ? "bg-elevated" : "text-muted-foreground")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {/* Content */}
      {projectTasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add your first task to get this project started." action={{ label: "Add task", onClick: () => { setEditTaskId(undefined); setTaskModalOpen(true); } }} />
      ) : view === "list" ? (
        <div className="space-y-2">
          {projectTasks.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      ) : (
        <KanbanBoard
          tasks={projectTasks}
          onStatusChange={(id, status) =>
            updateTask.mutate(
              { id, patch: { status, completedAt: status === "done" ? new Date().toISOString() : undefined } },
              {
                onSuccess: () => toast.success("Task moved"),
                onError: (error) => toast.error(error.message || "Could not move task."),
              },
            )
          }
        />
      )}

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} editProjectId={project.id} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete project?"
        description={`"${project.name}" will be deleted. Its tasks will move to the inbox.`}
        onConfirm={() =>
          delProject.mutate(project.id, {
            onSuccess: () => {
              tasks.filter((t) => t.projectId === project.id).forEach((t) => updateTask.mutate({ id: t.id, patch: { projectId: undefined } }));
              toast.success("Project deleted");
              navigate("/app/projects");
            },
            onError: (error) =>
              toast.error(error.message || "Could not delete project."),
          })
        }
      />
    </div>
  );
};