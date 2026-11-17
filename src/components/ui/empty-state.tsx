import { Inbox } from "lucide-react";
import { Button } from "./button";

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-clay bg-elevated shadow-clay">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="text-[15px] font-semibold">{title}</h3>
    <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
    {action && (
      <Button className="mt-4" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);