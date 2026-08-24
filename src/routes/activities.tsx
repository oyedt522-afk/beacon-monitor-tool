import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, ListChecks, MapPin, Play, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nirikshan/AppShell";
import { CameraCapture } from "@/components/nirikshan/CameraCapture";
import { StatCard } from "@/components/nirikshan/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  activitiesQuery,
  fmtCoords,
  fmtDate,
  getCurrentPosition,
  inspectionsQuery,
  type ActivityRow,
} from "@/lib/nirikshan";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Activity Verification — Nirikshan Field Inspections" },
      {
        name: "description",
        content:
          "Start a field inspection, capture geo-tagged photo evidence with timestamps and record verified beneficiary counts.",
      },
      { property: "og:title", content: "Activity Verification — Nirikshan" },
      {
        property: "og:description",
        content: "Geo-tagged evidence capture and beneficiary verification for field activities.",
      },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const activities = useQuery(activitiesQuery);
  const inspections = useQuery(inspectionsQuery);
  const rows = activities.data ?? [];
  const inspected = new Set((inspections.data ?? []).map((i) => i.activity_id));

  return (
    <AppShell
      title="Activity Verification"
      description="Select an activity, capture geo-tagged evidence and submit for verification"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Activities" value={rows.length} icon={ListChecks} index={0} />
        <StatCard
          label="Inspected"
          value={inspected.size}
          icon={Play}
          tone="verified"
          index={1}
        />
        <StatCard
          label="Pending"
          value={rows.filter((r) => !inspected.has(r.id)).length}
          icon={CalendarDays}
          tone="review"
          index={2}
        />
      </div>

      {activities.isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => (
            <ActivityCard key={a.id} activity={a} inspected={inspected.has(a.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ActivityCard({
  activity,
  inspected,
}: {
  activity: ActivityRow;
  inspected: boolean;
}) {
  return (
    <article className="card-surface flex flex-col gap-3 p-5">
      <div>
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          {activity.department}
          {activity.scheme_code ? ` · ${activity.scheme_code}` : ""}
        </p>
        <h3 className="font-display mt-1 text-base font-semibold">{activity.name}</h3>
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs">{activity.description}</p>
      <div className="text-muted-foreground space-y-1 text-xs">
        <p className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {activity.location}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" /> {fmtDate(activity.scheduled_date)}
        </p>
        <p className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {activity.employees?.full_name ?? "Unassigned"}
        </p>
      </div>
      <StartInspectionDialog activity={activity} inspected={inspected} />
    </article>
  );
}

function StartInspectionDialog({
  activity,
  inspected,
}: {
  activity: ActivityRow;
  inspected: boolean;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [count, setCount] = useState("0");
  const [notes, setNotes] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!gps) throw new Error("Capture GPS location before submitting");
      if (shots.length === 0) throw new Error("Capture at least one photo of the activity");
      const now = new Date().toISOString();
      const beneficiaryCount = Number(count) || 0;
      const status =
        shots.length >= 2 && beneficiaryCount > 0
          ? "completed"
          : shots.length >= 1
            ? "partially_completed"
            : "not_verified";

      const { data, error } = await supabase
        .from("inspections")
        .insert({
          activity_id: activity.id,
          inspector_employee_id: activity.responsible_employee_id,
          beneficiary_count: beneficiaryCount,
          captured_at: now,
          submitted_at: now,
          lat: gps.lat,
          lng: gps.lng,
          notes: notes || null,
          stage: "submitted",
          status,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: evErr } = await supabase.from("activity_evidence").insert(
        shots.map((media_url, i) => ({
          inspection_id: data.id,
          media_url,
          media_type: "photo",
          caption: `Field evidence ${i + 1}`,
          captured_at: now,
          lat: gps.lat,
          lng: gps.lng,
        })),
      );
      if (evErr) throw evErr;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Inspection submitted");
      void qc.invalidateQueries({ queryKey: ["inspections"] });
      setOpen(false);
      navigate({ to: "/inspections/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={inspected ? "outline" : "default"} size="sm" className="mt-auto">
          <Play className="size-4" /> {inspected ? "Re-inspect" : "Start inspection"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{activity.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg border p-3 text-xs">
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5" />
              {gps ? fmtCoords(gps.lat, gps.lng) : "No GPS fix yet"}
            </p>
            <p className="text-muted-foreground mt-1">
              Timestamp: {new Date().toLocaleString()}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={async () => {
              try {
                setGps(await getCurrentPosition());
                toast.success("Location captured");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <MapPin className="size-4" /> Capture GPS
          </Button>

          <CameraCapture
            label="Capture evidence"
            onCapture={(url) => setShots((prev) => [...prev, url])}
          />
          {shots.length ? (
            <div className="flex gap-2 overflow-x-auto">
              {shots.map((s, i) => (
                <img
                  key={i}
                  src={s}
                  alt={`Captured field evidence ${i + 1}`}
                  className="size-16 shrink-0 rounded border object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Beneficiary count</Label>
            <Input
              type="number"
              min={0}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Field notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <Button
            className="w-full"
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
          >
            Submit inspection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
