"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-popover! text-popover-foreground! border-border! rounded-lg! shadow-lg!",
          title: "text-sm! font-medium!",
          description: "text-xs! text-muted-foreground!",
          success: "bg-success-soft! border-success/30! text-success!",
          error: "bg-danger-soft! border-danger/30! text-danger!",
        },
      }}
    />
  );
}