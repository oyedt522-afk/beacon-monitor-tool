import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceVerification =
  Database["public"]["Tables"]["attendance_verifications"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type Inspection = Database["public"]["Tables"]["inspections"]["Row"];
export type Evidence = Database["public"]["Tables"]["activity_evidence"]["Row"];
export type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];

export type AttendanceStatus = Attendance["status"];
export type InspectionStatus = Inspection["status"];
export type TimelineStage = Inspection["stage"];

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; tone: "verified" | "review" | "priority" }
> = {
  verified: { label: "Verified", tone: "verified" },
  requires_review: { label: "Requires Review", tone: "review" },
  inspection_priority: { label: "Inspection Priority", tone: "priority" },
};

export const INSPECTION_STATUS_META: Record<
  InspectionStatus,
  { label: string; tone: "verified" | "review" | "priority" }
> = {
  completed: { label: "Completed", tone: "verified" },
  partially_completed: { label: "Partially Completed", tone: "review" },
  not_verified: { label: "Not Verified", tone: "priority" },
};

export const TIMELINE_STAGES: { key: TimelineStage; label: string }[] = [
  { key: "created", label: "Created" },
  { key: "evidence_captured", label: "Evidence Captured" },
  { key: "submitted", label: "Submitted" },
  { key: "verified", label: "Verified" },
];

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Rough metre distance between two coordinates (equirectangular approximation). */
export function metresBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const mLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const x = dLng * Math.cos(mLat);
  return Math.round(Math.sqrt(dLat * dLat + x * x) * R);
}

export const GPS_TOLERANCE_M = 400;
export const LATE_CUTOFF_MINUTES = 9 * 60 + 30; // 09:30

export function hoursBetween(from: string, to: string): number {
  return Math.round(((+new Date(to) - +new Date(from)) / 3_600_000) * 100) / 100;
}

export function deriveAttendanceStatus(input: {
  gpsValid: boolean;
  isLate: boolean;
  missingCheckout: boolean;
  randomPassed: boolean | null;
  failedVerifications: number;
}): AttendanceStatus {
  if (input.failedVerifications >= 2 || (input.missingCheckout && !input.gpsValid)) {
    return "inspection_priority";
  }
  if (input.isLate || !input.gpsValid || input.missingCheckout || input.randomPassed !== true) {
    return "requires_review";
  }
  return "verified";
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location services are unavailable on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Unable to read GPS location")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export const fmtTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

export const fmtDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtCoords = (lat: number | null, lng: number | null) =>
  lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "—";

/* ---------------- queries ---------------- */

export const employeesQuery = {
  queryKey: ["employees"],
  queryFn: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("full_name");
    if (error) throw error;
    return data ?? [];
  },
};

export type AttendanceRow = Attendance & {
  employees: Pick<Employee, "full_name" | "employee_code" | "department" | "posting_location"> | null;
};

export const attendanceQuery = (limit = 400) => ({
  queryKey: ["attendance", limit],
  queryFn: async (): Promise<AttendanceRow[]> => {
    const { data, error } = await supabase
      .from("attendance")
      .select(
        "*, employees(full_name, employee_code, department, posting_location)",
      )
      .order("work_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AttendanceRow[];
  },
});

export const verificationsQuery = {
  queryKey: ["attendance_verifications"],
  queryFn: async (): Promise<AttendanceVerification[]> => {
    const { data, error } = await supabase
      .from("attendance_verifications")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
};

export type ActivityRow = Activity & {
  employees: Pick<Employee, "full_name" | "employee_code"> | null;
};

export const activitiesQuery = {
  queryKey: ["activities"],
  queryFn: async (): Promise<ActivityRow[]> => {
    const { data, error } = await supabase
      .from("activities")
      .select("*, employees:responsible_employee_id(full_name, employee_code)")
      .order("scheduled_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ActivityRow[];
  },
};

export type InspectionRow = Inspection & {
  activities: Pick<
    Activity,
    "name" | "department" | "location" | "scheme_code" | "scheduled_date"
  > | null;
  employees: Pick<Employee, "full_name" | "employee_code" | "designation"> | null;
};

export const inspectionsQuery = {
  queryKey: ["inspections"],
  queryFn: async (): Promise<InspectionRow[]> => {
    const { data, error } = await supabase
      .from("inspections")
      .select(
        "*, activities(name, department, location, scheme_code, scheduled_date), employees:inspector_employee_id(full_name, employee_code, designation)",
      )
      .order("captured_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as InspectionRow[];
  },
};

export const inspectionDetailQuery = (id: string) => ({
  queryKey: ["inspection", id],
  queryFn: async () => {
    const [inspection, evidence, beneficiaries] = await Promise.all([
      supabase
        .from("inspections")
        .select(
          "*, activities(name, department, location, scheme_code, scheduled_date, lat, lng, description), employees:inspector_employee_id(full_name, employee_code, designation)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("activity_evidence")
        .select("*")
        .eq("inspection_id", id)
        .order("captured_at"),
      supabase.from("beneficiaries").select("*").eq("inspection_id", id).order("full_name"),
    ]);
    if (inspection.error) throw inspection.error;
    if (evidence.error) throw evidence.error;
    if (beneficiaries.error) throw beneficiaries.error;
    return {
      inspection: inspection.data as
        | (InspectionRow & {
            activities:
              | (InspectionRow["activities"] & {
                  lat: number | null;
                  lng: number | null;
                  description: string | null;
                })
              | null;
          })
        | null,
      evidence: evidence.data ?? [],
      beneficiaries: beneficiaries.data ?? [],
    };
  },
});
