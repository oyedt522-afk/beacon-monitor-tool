import { cn } from "@/lib/utils";

type Tone = "verified" | "review" | "priority" | "neutral";

const toneClass: Record<Tone, string> = {
  verified: "bg-verified/12 text-verified border-verified/30",
  review: "bg-review/15 text-review border-review/35",
  priority: "bg-priority/12 text-priority border-priority/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

const dotClass: Record<Tone, string> = {
  verified: "bg-verified",
  review: "bg-review",
  priority: "bg-priority",
  neutral: "bg-muted-foreground",
};

export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClass[tone])} />
      {label}
    </span>
  );
}
