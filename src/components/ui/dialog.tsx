import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = ({
  className,
  children,
  title,
  description,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="dialog-backdrop fixed inset-0 z-50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
    <DialogPrimitive.Content
      className={cn(
        "dialog-clay fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-surface p-6",
        "dialog-scrollbar-hidden data-[state=open]:animate-clay-pop max-h-[90vh] overflow-y-auto overscroll-contain",
        className,
      )}
    >
      <div className="mb-4">
        <DialogPrimitive.Title className="text-[17px] font-semibold">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="mt-1 text-[13px] text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        )}
      </div>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground shadow-clay hover:bg-elevated hover:shadow-clay-hover">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);