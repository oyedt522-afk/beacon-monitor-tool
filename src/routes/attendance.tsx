import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, LogIn, LogOut, MapPin, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nirikshan/AppShell";
import { CameraCapture } from "@/components/nirikshan/CameraCapture";
import { StatCard } from "@/components/nirikshan/StatCard";
import { StatusBadge } from "@/components/nirikshan/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  ATTENDANCE_STATUS_META,
  GPS_TOLERANCE_M,
  LATE_CUTOFF_MINUTES,
  attendanceQuery,
  deriveAttendanceStatus,
  employeesQuery,
  fmtCoords,
  fmtDate,
  fmtTime,
  getCurrentPosition,
  hoursBetween,
  metresBetween,
  todayISO,
  verificationsQuery,
} from "@/lib/nirikshan";
import { useStaff } from "@/lib/staff-store";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Staff Attendance Verification — Nirikshan" },
      {
        name: "description",
        content:
          "GPS-anchored check-in and check-out with face verification, random re-verification and automatic working-hours calculation.",
      },
      { property: "og:title", content: "Staff Attendance Verification — Nirikshan" },
      {
        property: "og:description",
        content: "GPS, face and random verification for field staff attendance.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const qc = useQueryClient();
  const localStaff = useStaff();
  const employees = useQuery(employeesQuery);
  const attendance = useQuery(attendanceQuery());
  const verifications = useQuery(verificationsQuery);

  const [employeeId, setEmployeeId] = useState<string>("");
  const [face, setFace] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const employee = employees.data?.find((e) => e.id === employeeId) ?? null;
  const localSelected = employeeId.startsWith("local:")
    ? (localStaff.find((s) => `local:${s.id}` === employeeId) ?? null)
    : null;
  const rows = attendance.data ?? [];
  const todays = rows.filter((r) => r.work_date === todayISO());
  const myToday = todays.find((r) => r.employee_id === employeeId) ?? null;

  const distance = useMemo(() => {
    if (!employee || !gps) return null;
    return metresBetween(gps.lat, gps.lng, employee.expected_lat, employee.expected_lng);
  }, [employee, gps]);
  const gpsValid = distance != null && distance <= GPS_TOLERANCE_M;

  const failedByAttendance = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of verifications.data ?? []) {
      if (v.passed === false) map[v.attendance_id] = (map[v.attendance_id] ?? 0) + 1;
    }
    return map;
  }, [verifications.data]);

  async function readGps() {
    try {
      setGps(await getCurrentPosition());
      toast.success("Location captured");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!employee) throw new Error("Select a staff member first");
      if (!gps) throw new Error("Capture GPS location before check-in");
      if (!face) throw new Error("Complete face verification before check-in");
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const isLate = minutes > LATE_CUTOFF_MINUTES;
      const { error } = await supabase.from("attendance").insert({
        employee_id: employee.id,
        work_date: todayISO(),
        check_in_at: now.toISOString(),
        check_in_lat: gps.lat,
        check_in_lng: gps.lng,
        check_in_face_captured: true,
        gps_valid: gpsValid,
        is_late: isLate,
        missing_checkout: true,
        working_hours: 0,
        status: deriveAttendanceStatus({
          gpsValid,
          isLate,
          missingCheckout: true,
          randomPassed: null,
          failedVerifications: 0,
        }),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checked in");
      void qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      if (!myToday?.check_in_at) throw new Error("No open check-in for today");
      if (!gps) throw new Error("Capture GPS location before check-out");
      const now = new Date().toISOString();
      const hours = hoursBetween(myToday.check_in_at, now);
      const { error } = await supabase
        .from("attendance")
        .update({
          check_out_at: now,
          check_out_lat: gps.lat,
          check_out_lng: gps.lng,
          check_out_face_captured: Boolean(face),
          missing_checkout: false,
          working_hours: hours,
          gps_valid: myToday.gps_valid && gpsValid,
          status: deriveAttendanceStatus({
            gpsValid: myToday.gps_valid && gpsValid,
            isLate: myToday.is_late,
            missingCheckout: false,
            randomPassed: null,
            failedVerifications: failedByAttendance[myToday.id] ?? 0,
          }),
        })
        .eq("id", myToday.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checked out — working hours recorded");
      void qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const randomVerify = useMutation({
    mutationFn: async (attendanceId: string) => {
      const position = await getCurrentPosition().catch(() => null);
      const passed = Boolean(face) && position != null;
      const { error } = await supabase.from("attendance_verifications").insert({
        attendance_id: attendanceId,
        face_captured: Boolean(face),
        lat: position?.lat ?? null,
        lng: position?.lng ?? null,
        passed,
        responded_at: new Date().toISOString(),
        reason: passed ? "Random check passed" : "Face or location missing",
      });
      if (error) throw error;
      return passed;
    },
    onSuccess: (passed) => {
      toast[passed ? "success" : "error"](
        passed ? "Random verification passed" : "Random verification failed",
      );
      void qc.invalidateQueries({ queryKey: ["attendance_verifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const randomTarget = todays.find((r) => !r.check_out_at) ?? todays[0];

  return (
    <AppShell
      title="Staff Attendance Verification"
      description="GPS geofence, face verification placeholder and random re-verification"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Marked today" value={todays.length} icon={Clock} index={0} />
        <StatCard
          label="Verified"
          value={todays.filter((r) => r.status === "verified").length}
          icon={CheckCircle2}
          tone="verified"
          index={1}
        />
        <StatCard
          label="Requires review"
          value={todays.filter((r) => r.status === "requires_review").length}
          icon={ShieldQuestion}
          tone="review"
          index={2}
        />
        <StatCard
          label="Random checks"
          value={verifications.data?.length ?? 0}
          icon={MapPin}
          hint={`${(verifications.data ?? []).filter((v) => v.passed === false).length} failed`}
          index={3}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[380px_1fr]">
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-display text-sm font-semibold">Mark attendance</h2>

          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {(employees.data ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name} · {e.employee_code}
                </SelectItem>
              ))}
              {localStaff
                .filter((s) => s.status === "active")
                .map((s) => (
                  <SelectItem key={s.id} value={`local:${s.id}`}>
                    {s.fullName} · {s.staffId}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="bg-muted/40 space-y-1 rounded-lg border p-3 text-xs">
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5" /> {gps ? fmtCoords(gps.lat, gps.lng) : "No GPS fix yet"}
            </p>
            {employee ? (
              <p className="text-muted-foreground">
                Posting: {employee.posting_location}
                {distance != null
                  ? ` · ${distance} m from duty point (${gpsValid ? "inside" : "outside"} ${GPS_TOLERANCE_M} m geofence)`
                  : ""}
              </p>
            ) : null}
          </div>
          <Button variant="secondary" size="sm" onClick={readGps} className="w-full">
            <MapPin className="size-4" /> Capture GPS location
          </Button>

          <CameraCapture onCapture={setFace} />

          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!employeeId || Boolean(myToday) || checkIn.isPending}
              onClick={() => checkIn.mutate()}
            >
              <LogIn className="size-4" /> Check in
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!myToday || Boolean(myToday?.check_out_at) || checkOut.isPending}
              onClick={() => checkOut.mutate()}
            >
              <LogOut className="size-4" /> Check out
            </Button>
          </div>

          {myToday ? (
            <p className="text-muted-foreground text-xs">
              Today: in {fmtTime(myToday.check_in_at)} · out {fmtTime(myToday.check_out_at)} ·{" "}
              {myToday.working_hours} h
            </p>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={!randomTarget || randomVerify.isPending}
            onClick={() => randomTarget && randomVerify.mutate(randomTarget.id)}
          >
            <ShieldQuestion className="size-4" /> Trigger random verification
          </Button>
        </section>

        <section className="card-surface p-5">
          <h2 className="font-display mb-4 text-sm font-semibold">Attendance register</h2>
          {attendance.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 40).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{r.employees?.full_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {r.employees?.employee_code}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(r.work_date)}</TableCell>
                      <TableCell className="text-xs">{fmtTime(r.check_in_at)}</TableCell>
                      <TableCell className="text-xs">{fmtTime(r.check_out_at)}</TableCell>
                      <TableCell className="text-xs">{r.working_hours}</TableCell>
                      <TableCell className="text-xs">
                        {r.gps_valid ? "Inside" : "Outside"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          tone={ATTENDANCE_STATUS_META[r.status].tone}
                          label={ATTENDANCE_STATUS_META[r.status].label}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
