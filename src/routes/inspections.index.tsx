import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin, Users } from "lucide-react";

import { AppShell } from "@/components/nirikshan/AppShell";
import { StatusBadge } from "@/components/nirikshan/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  INSPECTION_STATUS_META,
  fmtCoords,
  fmtDate,
  inspectionsQuery,
} from "@/lib/nirikshan";

export const Route = createFileRoute("/inspections/")({
  head: () => ({
    meta: [
      { title: "Inspection Records — Nirikshan Verification Log" },
      {
        name: "description",
        content:
          "Browse submitted field inspections with verification status, geo-tagged evidence and beneficiary counts.",
      },
      { property: "og:title", content: "Inspection Records — Nirikshan" },
      {
        property: "og:description",
        content: "Submitted field inspections and their verification outcomes.",
      },
    ],
  }),
  component: InspectionsPage,
});

function InspectionsPage() {
  const inspections = useQuery(inspectionsQuery);
  const rows = inspections.data ?? [];

  return (
    <AppShell title="Inspections" description="Submitted field verification records">
      {inspections.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((i) => (
            <Link
              key={i.id}
              to="/inspections/$id"
              params={{ id: i.id }}
              className="card-surface hover:shadow-elevated flex items-center gap-4 p-4 transition-shadow"
            >
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {i.activities?.department}
                </p>
                <p className="truncate text-sm font-medium">{i.activities?.name}</p>
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {fmtCoords(i.lat, i.lng)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {i.beneficiary_count} beneficiaries
                  </span>
                  <span>{fmtDate(i.captured_at)}</span>
                  <span>{i.employees?.full_name}</span>
                </div>
              </div>
              <StatusBadge
                tone={INSPECTION_STATUS_META[i.status].tone}
                label={INSPECTION_STATUS_META[i.status].label}
              />
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
