import { useEffect } from "react";
import type { Task } from "@/lib/types";

const enabledKey = "taskflow_notifications_enabled";
const notifiedKey = "taskflow_notified_reminders";
const settingsEvent = "taskflow-notifications-changed";
const MAX_LATE_MINUTES = 24 * 60;

const getNotifiedReminders = (): Set<string> => {
  const stored = localStorage.getItem(notifiedKey);
  if (!stored) return new Set();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
      return new Set(parsed);
    }
    console.error("Saved task reminder notifications have an invalid format.");
  } catch (error) {
    console.error("Could not read saved task reminder notifications.", error);
  }
  return new Set();
};

const dueDateReminder = (task: Task): { key: string; at: Date } | undefined => {
  if (!task.dueDate) return undefined;
  const date = task.dueDate.slice(0, 10);
  const at = new Date(`${date}T09:00:00`);
  if (Number.isNaN(at.getTime())) return undefined;
  return { key: `due:${task.id}:${date}`, at };
};

export const useTaskReminders = (tasks: Task[]) => {
  useEffect(() => {
    const checkReminders = () => {
      if (
        localStorage.getItem(enabledKey) !== "true" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const now = Date.now();
      const notified = getNotifiedReminders();
      let changed = false;

      tasks.forEach((task) => {
        if (task.status === "done") return;
        const reminders = [
          dueDateReminder(task),
          task.reminderAt
            ? { key: `custom:${task.id}:${task.reminderAt}`, at: new Date(task.reminderAt) }
            : undefined,
        ].filter((reminder): reminder is { key: string; at: Date } => Boolean(reminder));

        reminders.forEach(({ key, at }) => {
          if (Number.isNaN(at.getTime())) return;
          const lateMinutes = (now - at.getTime()) / 60_000;
          if (notified.has(key) || lateMinutes < 0 || lateMinutes > MAX_LATE_MINUTES) return;
          try {
            new Notification(task.title, {
              body: key.startsWith("due:")
                ? "This task is due today."
                : "Your task reminder is due.",
              tag: key,
            });
            notified.add(key);
            changed = true;
          } catch (error) {
            console.error("Could not display a task reminder notification.", error);
          }
        });
      });

      if (changed) {
        localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
      }
    };

    checkReminders();
    const intervalId = window.setInterval(checkReminders, 60_000);
    window.addEventListener("focus", checkReminders);
    window.addEventListener(settingsEvent, checkReminders);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkReminders);
      window.removeEventListener(settingsEvent, checkReminders);
    };
  }, [tasks]);
};

export const taskNotificationSettingsEvent = settingsEvent;
