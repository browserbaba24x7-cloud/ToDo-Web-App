import { Badge } from "@/components/ui/badge";
import { statusConfig } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const cfg = statusConfig[status];
  return <Badge className={`${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>;
};