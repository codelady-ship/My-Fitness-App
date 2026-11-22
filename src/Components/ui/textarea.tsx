import * as React from "react"
import { cn } from "@/lib/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base text-foreground transition-colors placeholder:text-muted-foreground hover:border-[#9aa3b5] focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive desk:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
