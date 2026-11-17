import type { Database } from "../database.types";
import type { Project, Task } from "../types";
import { supabase } from "../supabase";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

const mapTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date ?? undefined,
  projectId: row.project_id ?? undefined,
  labels: row.labels ?? [],
  createdAt: row.created_at,
  completedAt: row.completed_at ?? undefined,
});

const mapProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  color: row.color ?? "#8B5CF6",
  createdAt: row.created_at,
});

const getUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to save data.");
  return data.user.id;
};

const toTaskInsert = (task: Task, userId: string): TaskInsert => ({
  user_id: userId,
  title: task.title,
  description: task.description ?? null,
  status: task.status,
  priority: task.priority,
  due_date: task.dueDate ?? null,
  project_id: task.projectId ?? null,
  labels: task.labels,
  completed_at: task.completedAt ?? null,
});

const toTaskUpdate = (patch: Partial<Task>): TaskUpdate => {
  const update: TaskUpdate = {};
  if (patch.title !== undefined) update.title = patch.title;
  if ("description" in patch) update.description = patch.description ?? null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if ("dueDate" in patch) update.due_date = patch.dueDate ?? null;
  if ("projectId" in patch) update.project_id = patch.projectId ?? null;
  if (patch.labels !== undefined) update.labels = patch.labels;
  if ("completedAt" in patch) update.completed_at = patch.completedAt ?? null;
  return update;
};

const toProjectInsert = (
  project: Project,
  userId: string,
): ProjectInsert => ({
  user_id: userId,
  name: project.name,
  description: project.description ?? null,
  color: project.color,
});

const toProjectUpdate = (patch: Partial<Project>): ProjectUpdate => {
  const update: ProjectUpdate = {};
  if (patch.name !== undefined) update.name = patch.name;
  if ("description" in patch) update.description = patch.description ?? null;
  if (patch.color !== undefined) update.color = patch.color;
  return update;
};

export const taskService = {
  async list(): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(mapTask);
  },

  async create(task: Task): Promise<Task> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("tasks")
      .insert(toTaskInsert(task, userId))
      .select()
      .single();
    if (error) throw error;
    return mapTask(data);
  },

  async update(id: string, patch: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(toTaskUpdate(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapTask(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};

export const projectService = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(mapProject);
  },

  async create(project: Project): Promise<Project> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("projects")
      .insert(toProjectInsert(project, userId))
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  async update(id: string, patch: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update(toProjectUpdate(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};
