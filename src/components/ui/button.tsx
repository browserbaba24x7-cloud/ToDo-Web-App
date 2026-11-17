import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl text-[13px] font-bold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-clay hover:shadow-clay-hover hover:-translate-y-0.5 active:translate-y-px active:shadow-clay-press",
        secondary:
          "border-2 border-border bg-elevated text-foreground shadow-clay hover:shadow-clay-hover hover:-translate-y-0.5 active:translate-y-px active:shadow-clay-press",
        ghost:
          "text-muted-foreground hover:bg-surface hover:text-foreground hover:shadow-clay active:shadow-clay-press",
        danger:
          "bg-danger text-danger-foreground shadow-clay hover:shadow-clay-hover hover:-translate-y-0.5 active:translate-y-px active:shadow-clay-press",
        outline:
          "border-2 border-border bg-surface text-foreground shadow-clay hover:shadow-clay-hover hover:-translate-y-0.5 active:translate-y-px active:shadow-clay-press",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-10 px-5",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";