import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateId, cn } from "@/lib/utils";
import { useCreateProject, useProjects, useUpdateProject } from "@/lib/store/project-store";
import { toast } from "sonner";

const COLORS = ["#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6"];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  description: z.string().max(300).optional(),
  color: z.string(),
});

export const ProjectFormDialog = ({
  open,
  onOpenChange,
  editProjectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editProjectId?: string;
}) => {
  const { data: projects = [] } = useProjects();
  const create = useCreateProject();
  const update = useUpdateProject();
  const editing = projects.find((p) => p.id === editProjectId);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", color: COLORS[0] },
  });

  useEffect(() => {
    if (open) {
      if (editing) form.reset({ name: editing.name, description: editing.description || "", color: editing.color });
      else form.reset({ name: "", description: "", color: COLORS[0] });
    }
  }, [open, editing]);

  const color = form.watch("color");

  const onSubmit = form.handleSubmit((values) => {
    const payload = { id: editing?.id || generateId(), ...values, createdAt: editing?.createdAt || new Date().toISOString() };
    const onSuccess = () => {
      toast.success(editing ? "Project updated" : "Project created");
      onOpenChange(false);
    };
    const onError = (error: Error) =>
      toast.error(error.message || "Could not save project.");
    if (editing)
      update.mutate({ id: editing.id, patch: payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit project" : "Create project"} description="Organize related tasks into a project.">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Name</label>
            <Input {...form.register("name")} placeholder="e.g., Website Redesign" autoFocus />
            {form.formState.errors.name && <p className="mt-1 text-[12px] text-danger-foreground">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Description</label>
            <Textarea {...form.register("description")} placeholder="What's this project about?" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => form.setValue("color", c)}
                  className={cn("h-7 w-7 rounded-full transition-transform", color === c && "ring-2 ring-offset-2 ring-offset-surface scale-110")}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};