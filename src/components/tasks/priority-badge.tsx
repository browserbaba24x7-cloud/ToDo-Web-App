import { Badge } from "@/components/ui/badge";
import { priorityConfig } from "@/lib/utils";
import type { Priority } from "@/lib/types";

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const cfg = priorityConfig[priority];
  return (
    <Badge className={`${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </Badge>
  );
};