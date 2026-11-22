import * as React from "react"
import { cn } from "@/lib/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 16px text below the desktop size, so iOS does not zoom into a focused field
        "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3.5 py-1 text-base text-foreground transition-colors selection:bg-accent placeholder:text-muted-foreground hover:border-[#9aa3b5] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 desk:h-10 desk:text-sm",
        "focus-visible:border-ring",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
