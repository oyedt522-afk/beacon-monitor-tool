import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  index = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "verified" | "review" | "priority";
  index?: number;
}) {
  const toneRing = {
    neutral: "bg-primary/10 text-primary",
    verified: "bg-verified/12 text-verified",
    review: "bg-review/15 text-review",
    priority: "bg-priority/12 text-priority",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="card-surface p-5 transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-display mt-2 text-3xl leading-none font-semibold">{value}</p>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("grid size-10 place-items-center rounded-lg", toneRing)}>
          <Icon className="size-5" />
        </span>
      </div>
    </motion.div>
  );
}
