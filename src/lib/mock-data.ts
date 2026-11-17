import type { Task, Project, User } from "./types";
import { subDays, addDays, formatISO } from "date-fns";

const today = new Date();
const iso = (d: Date) => formatISO(d);

export const mockUser: User = {
  id: "u1",
  name: "Alex Morgan",
  email: "alex.morgan@taskflow.app",
};

export const mockProjects: Project[] = [
  { id: "p1", name: "Website Redesign", description: "Marketing site refresh with new brand identity", color: "#8B5CF6", createdAt: iso(subDays(today, 20)) },
  { id: "p2", name: "Mobile App v2", description: "iOS and Android release with offline sync", color: "#22C55E", createdAt: iso(subDays(today, 12)) },
  { id: "p3", name: "Q1 Marketing", description: "Launch campaign for new pricing tier", color: "#F59E0B", createdAt: iso(subDays(today, 5)) },
  { id: "p4", name: "Design System", description: "Unify components across products", color: "#EF4444", createdAt: iso(subDays(today, 3)) },
];

export const mockTasks: Task[] = [
  { id: "t1", title: "Build authentication flow", description: "Implement login, signup, and password reset with validation", status: "in_progress", priority: "high", dueDate: iso(today), projectId: "p1", labels: ["frontend", "auth"], createdAt: iso(subDays(today, 3)) },
  { id: "t2", title: "Complete landing page design", description: "Finalize hero, features, and pricing sections", status: "todo", priority: "urgent", dueDate: iso(addDays(today, 1)), projectId: "p1", labels: ["design"], createdAt: iso(subDays(today, 4)) },
  { id: "t3", title: "Fix dashboard responsiveness", description: "Tablet layout breaks on sidebar collapse", status: "todo", priority: "medium", dueDate: iso(subDays(today, 1)), projectId: "p2", labels: ["bug", "frontend"], createdAt: iso(subDays(today, 6)) },
  { id: "t4", title: "Review project documentation", status: "done", priority: "low", dueDate: iso(subDays(today, 2)), projectId: "p4", labels: ["docs"], createdAt: iso(subDays(today, 8)), completedAt: iso(subDays(today, 1)) },
  { id: "t5", title: "Prepare weekly report", description: "Compile metrics and blockers for sprint review", status: "todo", priority: "high", dueDate: iso(addDays(today, 2)), projectId: "p3", labels: ["report"], createdAt: iso(subDays(today, 1)) },
  { id: "t6", title: "Design empty states", description: "Illustrations and copy for all list views", status: "todo", priority: "medium", dueDate: iso(addDays(today, 4)), projectId: "p4", labels: ["design"], createdAt: iso(subDays(today, 2)) },
  { id: "t7", title: "Optimize image loading", status: "in_progress", priority: "medium", dueDate: iso(addDays(today, 3)), projectId: "p2", labels: ["performance"], createdAt: iso(subDays(today, 5)) },
  { id: "t8", title: "Write API integration docs", status: "todo", priority: "low", dueDate: iso(addDays(today, 8)), projectId: "p3", labels: ["docs"], createdAt: iso(subDays(today, 1)) },
  { id: "t9", title: "Set up error tracking", status: "done", priority: "high", dueDate: iso(subDays(today, 4)), projectId: "p2", labels: ["devops"], createdAt: iso(subDays(today, 9)), completedAt: iso(subDays(today, 3)) },
  { id: "t10", title: "Draft launch email", description: "Announce v2 to existing users", status: "todo", priority: "medium", dueDate: iso(addDays(today, 6)), projectId: "p3", labels: ["marketing"], createdAt: iso(subDays(today, 2)) },
  { id: "t11", title: "Refactor user store", status: "todo", priority: "low", labels: ["refactor"], createdAt: iso(subDays(today, 1)) },
  { id: "t12", title: "Investigate login bug", description: "Session drops on mobile Safari", status: "todo", priority: "urgent", dueDate: iso(addDays(today, 1)), labels: ["bug"], createdAt: iso(subDays(today, 1)) },
];