import { cn } from "@/lib/utils";

export const Badge = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "badge-clay inline-flex items-center px-2.5 py-1 text-[11px]",
      className,
    )}
    {...props}
  >
    {children}
  </span>
);