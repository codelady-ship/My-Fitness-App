import { cn } from "@/lib/cn";

type Tone = "active" | "passive" | "expired";

/* Pulsa's three card states, with a dot so the state is not carried by colour alone. Text is 4.5:1 or better. */
const tones: Record<Tone, string> = {
  active: "bg-[#e3f3ec] text-[#17794f]",
  passive: "bg-muted text-muted-foreground",
  expired: "bg-accent text-[#b02a19]",
};

/** Status pill. `children` is the label (shown capitalised, as before). */
const StatusBadge = ({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap capitalize before:size-1.5 before:rounded-full before:bg-current",
      tones[tone],
      className,
    )}
  >
    {children}
  </span>
);

export default StatusBadge;
