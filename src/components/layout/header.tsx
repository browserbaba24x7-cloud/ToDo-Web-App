import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, ListTodo, Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/store/project-store";
import { useTasks } from "@/lib/store/task-store";
import { useUIStore } from "@/lib/store/ui-store";

export const Header = ({
  title,
  onOpenTaskModal,
  onSelectTask,
}: {
  title?: string;
  onOpenTaskModal: () => void;
  onSelectTask: (taskId: string) => void;
}) => {
  const { setMobileNavOpen } = useUIStore();
  const navigate = useNavigate();
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useTasks();
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const query = search.trim().toLowerCase();
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const matchingTasks = useMemo(
    () =>
      query
        ? tasks
            .filter((task) =>
              [
                task.title,
                task.description,
                task.labels.join(" "),
                projectNames.get(task.projectId ?? ""),
              ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(query)),
            )
            .slice(0, 5)
        : [],
    [query, tasks, projectNames],
  );
  const matchingProjects = useMemo(
    () =>
      query
        ? projects
            .filter((project) =>
              [project.name, project.description]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(query)),
            )
            .slice(0, 3)
        : [],
    [query, projects],
  );
  const hasResults = matchingTasks.length > 0 || matchingProjects.length > 0;
  const isLoading = tasksLoading || projectsLoading;
  const hasError = tasksError || projectsError;

  const openTask = (taskId: string) => {
    setSearch("");
    setSearchOpen(false);
    onSelectTask(taskId);
  };

  const openProject = (projectId: string) => {
    setSearch("");
    setSearchOpen(false);
    navigate(`/app/projects/${projectId}`);
  };

  return (
    <header className="app-header flex h-16 items-center gap-3 border-b-2 px-4 md:px-6">
      <button
        className="md:hidden rounded p-1.5 hover:bg-elevated"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-[17px] font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            placeholder="Search…"
            aria-label="Search tasks and projects"
            aria-expanded={searchOpen && Boolean(query)}
            aria-controls="global-search-results"
            className="input h-9 w-56 rounded-full pl-8 text-[13px]"
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                setSearchOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearchOpen(false);
              if (event.key === "Enter" && matchingTasks[0]) openTask(matchingTasks[0].id);
              else if (event.key === "Enter" && matchingProjects[0]) openProject(matchingProjects[0].id);
            }}
          />
          {searchOpen && query && (
            <div
              id="global-search-results"
              role="region"
              aria-label="Search results"
              className="absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-clay-lg border-2 border-border bg-surface p-2 shadow-clay-hover"
            >
              {isLoading ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground" role="status">
                  Searching…
                </p>
              ) : (
                <>
                  {matchingTasks.length > 0 && (
                    <section>
                      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Tasks
                      </h2>
                      {matchingTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className="flex w-full items-start gap-3 rounded-clay px-3 py-2 text-left hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openTask(task.id)}
                        >
                          <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{task.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {projectNames.get(task.projectId ?? "") ?? "Inbox"} · {task.status.replace("_", " ")}
                            </span>
                          </span>
                        </button>
                      ))}
                    </section>
                  )}
                  {matchingProjects.length > 0 && (
                    <section>
                      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Projects
                      </h2>
                      {matchingProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className="flex w-full items-start gap-3 rounded-clay px-3 py-2 text-left hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openProject(project.id)}
                        >
                          <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{project.name}</span>
                            {project.description && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {project.description}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </section>
                  )}
                  {!hasResults && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground" role="status">
                      {hasError ? "Search results could not be loaded." : "No matching tasks or projects."}
                    </p>
                  )}
                  {hasResults && hasError && (
                    <p className="px-3 py-2 text-xs text-muted-foreground" role="status">
                      Some search results could not be loaded.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <Button size="sm" onClick={onOpenTaskModal}>
          <Plus className="h-3.5 w-3.5" /> New task
        </Button>
      </div>
    </header>
  );
};