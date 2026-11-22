"use client"

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/* Light only, like the rest of Pulsa (no next-themes). */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--ui-background)",
          "--normal-text": "var(--ui-foreground)",
          "--normal-border": "var(--ui-border)",
          "--border-radius": "14px",
          fontFamily: "var(--font-ui)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
