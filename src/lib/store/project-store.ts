import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/task-service";

export const useProjects = () =>
  useQuery({ queryKey: ["projects"], queryFn: projectService.list });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: any) => projectService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};