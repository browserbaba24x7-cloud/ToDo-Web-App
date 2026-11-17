import { create } from "zustand";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "../services/task-service";
import type { Task } from "../types";

export const useTasks = () =>
  useQuery({ queryKey: ["tasks"], queryFn: taskService.list });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: taskService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      taskService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};