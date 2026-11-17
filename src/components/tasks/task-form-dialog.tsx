import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, useCreateTask, useUpdateTask } from "@/lib/store/task-store";
import { useProjects } from "@/lib/store/project-store";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, Priority, TaskStatus } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "done"]),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  labels: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const TaskFormDialog = ({
  open,
  onOpenChange,
  editTaskId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTaskId?: string;
}) => {
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const create = useCreateTask();
  const update = useUpdateTask();
  const editing = tasks.find((t) => t.id === editTaskId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", priority: "medium", status: "todo", labels: "" },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({
          title: editing.title,
          description: editing.description || "",
          priority: editing.priority,
          status: editing.status,
          dueDate: editing.dueDate ? editing.dueDate.slice(0, 10) : "",
          projectId: editing.projectId || "",
          labels: editing.labels.join(", "),
        });
      } else {
        form.reset({ title: "", priority: "medium", status: "todo", labels: "" });
      }
    }
  }, [open, editing]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: Task = {
      id: editing?.id || generateId(),
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as Priority,
      status: values.status as TaskStatus,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      projectId: values.projectId || undefined,
      labels: values.labels ? values.labels.split(",").map((s) => s.trim()).filter(Boolean) : [],
      createdAt: editing?.createdAt || new Date().toISOString(),
      completedAt:
        values.status === "done"
          ? editing?.completedAt || new Date().toISOString()
          : undefined,
    };

    const onSuccess = () => {
      toast.success(editing ? "Task updated" : "Task created");
      onOpenChange(false);
      form.reset();
    };

    if (editing) {
      update.mutate(
        { id: editing.id, patch: payload },
        {
          onSuccess,
          onError: (error) => toast.error(error.message || "Could not update task."),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess,
        onError: (error) => toast.error(error.message || "Could not create task."),
      });
    }
  });

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? "Edit task" : "Create task"}
        description={editing ? "Update the task details below." : "Add a new task to your workspace."}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Title</label>
            <Input {...form.register("title")} placeholder="e.g., Review pull request" autoFocus />
            {form.formState.errors.title && (
              <p className="mt-1 text-[12px] text-danger-foreground">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Description</label>
            <Textarea {...form.register("description")} placeholder="Add details…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Priority</label>
              <select className="input" {...form.register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Status</label>
              <select className="input" {...form.register("status")}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Due date</label>
              <Input type="date" {...form.register("dueDate")} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Project</label>
              <select className="input" {...form.register("projectId")}>
                <option value="">Inbox</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Labels</label>
            <Input {...form.register("labels")} placeholder="Comma separated: design, frontend" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};