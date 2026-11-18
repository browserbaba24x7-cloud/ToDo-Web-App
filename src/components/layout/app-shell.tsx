import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { useUIStore } from "@/lib/store/ui-store";
import { useTasks, useUpdateTask } from "@/lib/store/task-store";
import { useProjects } from "@/lib/store/project-store";
import { toast, Toaster } from "sonner";
import { useTaskReminders } from "@/lib/hooks/use-task-reminders";
import { useAuth } from "@/lib/auth/auth-context";
import { registerDeviceSession } from "@/lib/services/device-session-service";

const routeTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/inbox": "Inbox",
  "/app/today": "Today",
  "/app/upcoming": "Upcoming",
  "/app/projects": "Projects",
  "/app/settings": "Settings",
};

const centerOverlayOnPointer: Modifier = ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  if (
    !(activatorEvent instanceof MouseEvent) ||
    !activeNodeRect ||
    !overlayNodeRect
  ) {
    return transform;
  }

  return {
    ...transform,
    x: transform.x + activatorEvent.clientX - activeNodeRect.left - overlayNodeRect.width / 2,
    y: transform.y + activatorEvent.clientY - activeNodeRect.top - overlayNodeRect.height / 2,
  };
};

export const AppShell = () => {
  const location = useLocation();
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const { session } = useAuth();
  const { data: tasks = [] } = useTasks();
  useTaskReminders(tasks);
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const {
    mobileNavOpen,
    setMobileNavOpen,
    taskModalOpen,
    setTaskModalOpen,
    editTaskId,
    setEditTaskId,
  } = useUIStore();

  useEffect(() => {
    if (!session) return;

    let active = true;
    let interval: number | undefined;
    const register = async () => {
      try {
        await registerDeviceSession(session);
        if (active && interval === undefined) {
          interval = window.setInterval(() => {
            void register();
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? `Could not update this device's session: ${error.message}`
              : "Could not update this device's session.",
          );
        }
      }
    };

    void register();
    return () => {
      active = false;
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [session?.access_token, session?.user.id]);

  const title =
    routeTitles[location.pathname] ||
    (location.pathname.startsWith("/app/projects/") ? "Project" : "TaskFlow");
  const isFocusPage = location.pathname === "/app/focus";
  const draggedTask = tasks.find((task) => task.id === activeTaskId);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(undefined);
    const activeId = String(event.active.id);
    const dropTargetId = event.over ? String(event.over.id) : "";
    if (!activeId.startsWith("task:")) return;

    const taskId = activeId.slice("task:".length);
    const targetProjectId =
      dropTargetId === "project:inbox"
        ? undefined
        : dropTargetId.startsWith("project:")
          ? dropTargetId.slice("project:".length)
          : null;
    const task = tasks.find((item) => item.id === taskId);
    const targetProject = targetProjectId
      ? projects.find((project) => project.id === targetProjectId)
      : undefined;

    if (
      !task ||
      targetProjectId === null ||
      (targetProjectId !== undefined && !targetProject) ||
      task.projectId === targetProjectId
    ) {
      return;
    }

    updateTask.mutate(
      { id: taskId, patch: { projectId: targetProjectId } },
      {
        onSuccess: () =>
          toast.success(
            targetProject ? `Task moved to ${targetProject.name}` : "Task moved to Inbox",
          ),
        onError: (error) => toast.error(error.message || "Could not move task."),
      },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const activeId = String(event.active.id);
        setActiveTaskId(activeId.startsWith("task:") ? activeId.slice("task:".length) : undefined);
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTaskId(undefined)}
    >
      <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background">
        {/* Desktop sidebar */}
        {!isFocusPage && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        {/* Mobile sidebar */}
        {!isFocusPage && mobileNavOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#3D2E28]/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="mobile-sidebar-enter fixed inset-y-0 left-0 z-50 md:hidden">
              <Sidebar onClose={() => setMobileNavOpen(false)} />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!isFocusPage && <Header
            title={title}
            onSelectTask={(taskId) => {
              setEditTaskId(taskId);
              setTaskModalOpen(true);
            }}
            onOpenTaskModal={() => {
              setEditTaskId(undefined);
              setTaskModalOpen(true);
            }}
          />}
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className={isFocusPage ? "min-h-full w-full" : "mx-auto w-full min-w-0 max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8"}>
              <Outlet />
            </div>
          </main>
        </div>

        <TaskFormDialog
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          editTaskId={editTaskId}
        />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "toast-clay !bg-surface !text-foreground !border-2 !border-border",
          }}
        />
        <DragOverlay modifiers={[centerOverlayOnPointer]}>
          {draggedTask && (
            <div className="w-[360px] rounded-clay border-2 bg-surface px-4 py-3 text-sm font-medium shadow-clay-hover">
              {draggedTask.title}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};