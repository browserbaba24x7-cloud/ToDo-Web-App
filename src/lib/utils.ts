import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import type { Priority, TaskStatus } from "./types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDueDate = (iso?: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isPast(date)) return `Overdue · ${format(date, "MMM d")}`;
  return format(date, "MMM d");
};

export const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "text-danger-foreground", bg: "bg-danger/40" },
  high: { label: "High", color: "text-warning-foreground", bg: "bg-warning/50" },
  medium: { label: "Medium", color: "text-primary-foreground", bg: "bg-primary/25" },
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-elevated" },
};

export const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: "Todo", color: "text-muted-foreground", bg: "bg-elevated" },
  in_progress: { label: "In Progress", color: "text-primary-foreground", bg: "bg-primary/25" },
  done: { label: "Done", color: "text-success-foreground", bg: "bg-success/45" },
};

export type UpcomingGroup = "overdue" | "today" | "tomorrow" | "this_week" | "next_week" | "later";

export const groupTaskByDate = (iso?: string): UpcomingGroup => {
  if (!iso) return "later";
  const date = new Date(iso);
  if (isPast(date) && !isToday(date)) return "overdue";
  if (isToday(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  if (date >= weekStart && date <= weekEnd) return "this_week";
  const nextWeekStart = startOfWeek(addWeeks(now, 1));
  const nextWeekEnd = endOfWeek(addWeeks(now, 1));
  if (date >= nextWeekStart && date <= nextWeekEnd) return "next_week";
  return "later";
};

export const generateId = () => Math.random().toString(36).substring(2, 11);