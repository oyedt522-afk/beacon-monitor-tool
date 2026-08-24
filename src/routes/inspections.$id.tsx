import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, MapPin, Users } from "lucide-react";

import { AppShell } from "@/components/nirikshan/AppShell";
import { StatusBadge } from "@/components/nirikshan/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  INSPECTION_STATUS_META,
  TIMELINE_STAGES,
  fmtCoords,
  fmtDate,
  fmtTime,
  inspectionDetailQuery,
} from "@/lib/nirikshan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspections/$id")({
  head: () => ({
    meta: [
      { title: "Inspection Detail — Nirikshan Evidence Review" },
      {
        name: "description",
        content:
          "Review geo-tagged photo evidence, verification timeline and beneficiary records for a single field inspection.",
      },
      { property: "og:title", content: "Inspection Detail — Nirikshan" },
      {
        property: "og:description",
        content: "Evidence, timeline and beneficiaries for a field inspection record.",
      },
    ],
  }),
  component: InspectionDetail,
});

function InspectionDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(inspectionDetailQuery(id));

  const inspection = data?.inspection ?? null;

  return (
    <AppShell
      title={inspection?.activities?.name ?? "Inspection"}
      description={inspection?.activities?.location ?? undefined}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/inspections">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !inspection ? (
        <p className="text-muted-foreground text-sm">This inspection record was not found.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="card-surface p-5">
            <h2 className="font-display mb-4 text-sm font-semibold">Captured evidence</h2>
            {data?.evidence.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.evidence.map((e) => (
                  <figure key={e.id} className="overflow-hidden rounded-lg border">
                    <img
                      src={e.media_url}
                      alt={e.caption ?? "Field inspection evidence photograph"}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                    <figcaption className="text-muted-foreground space-y-0.5 p-2 text-xs">
                      <p className="text-foreground font-medium">{e.caption}</p>
                      <p>
                        {fmtDate(e.captured_at)} {fmtTime(e.captured_at)}
                      </p>
                      <p>{fmtCoords(e.lat, e.lng)}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No evidence captured.</p>
            )}

            <h2 className="font-display mt-6 mb-3 text-sm font-semibold">
              Beneficiaries ({data?.beneficiaries.length ?? 0} of{" "}
              {inspection.beneficiary_count} reported)
            </h2>
            <div className="divide-border divide-y">
              {(data?.beneficiaries ?? []).map((b) => (
                <div key={b.id} className="py-2.5">
                  <p className="text-sm font-medium">{b.full_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {b.contact ?? "No contact"} · {b.remarks ?? "No remarks"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="card-surface space-y-3 p-5">
              <StatusBadge
                tone={INSPECTION_STATUS_META[inspection.status].tone}
                label={INSPECTION_STATUS_META[inspection.status].label}
              />
              <dl className="text-muted-foreground space-y-2 text-xs">
                <Row icon={Users} label="Beneficiaries" value={String(inspection.beneficiary_count)} />
                <Row icon={MapPin} label="GPS" value={fmtCoords(inspection.lat, inspection.lng)} />
                <Row
                  icon={Clock}
                  label="Captured"
                  value={`${fmtDate(inspection.captured_at)} ${fmtTime(inspection.captured_at)}`}
                />
              </dl>
              <p className="text-muted-foreground text-xs">
                Inspector: {inspection.employees?.full_name ?? "—"}
              </p>
              {inspection.notes ? (
                <p className="bg-muted/40 rounded-lg border p-3 text-xs">{inspection.notes}</p>
              ) : null}
            </section>

            <section className="card-surface p-5">
              <h2 className="font-display mb-4 text-sm font-semibold">Verification timeline</h2>
              <ol className="space-y-4">
                {TIMELINE_STAGES.map((stage, index) => {
                  const currentIndex = TIMELINE_STAGES.findIndex(
                    (s) => s.key === inspection.stage,
                  );
                  const done = index <= currentIndex;
                  return (
                    <li key={stage.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                          done
                            ? "bg-verified/15 text-verified border-verified/40"
                            : "text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          done ? "font-medium" : "text-muted-foreground",
                        )}
                      >
                        {stage.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
