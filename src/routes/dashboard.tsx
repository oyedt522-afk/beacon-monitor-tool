import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClipboardCheck, Clock, TriangleAlert, UserCheck } from "lucide-react";

import { AppShell } from "@/components/nirikshan/AppShell";
import { StatCard } from "@/components/nirikshan/StatCard";
import { StatusBadge } from "@/components/nirikshan/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ATTENDANCE_STATUS_META,
  INSPECTION_STATUS_META,
  attendanceQuery,
  employeesQuery,
  fmtDate,
  inspectionsQuery,
} from "@/lib/nirikshan";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Nirikshan Inspection Analytics" },
      {
        name: "description",
        content:
          "Live analytics on staff attendance verification, working hours and field activity inspections across departments.",
      },
      { property: "og:title", content: "Admin Dashboard — Nirikshan" },
      {
        property: "og:description",
        content: "Attendance and inspection analytics for field verification teams.",
      },
    ],
  }),
  component: DashboardPage,
});

const TONE_COLOR = {
  verified: "var(--verified)",
  review: "var(--review)",
  priority: "var(--priority)",
} as const;

function DashboardPage() {
  const attendance = useQuery(attendanceQuery());
  const inspections = useQuery(inspectionsQuery);
  const employees = useQuery(employeesQuery);

  const rows = attendance.data ?? [];
  const insp = inspections.data ?? [];
  const loading = attendance.isLoading || inspections.isLoading;

  const latestDate = rows[0]?.work_date;
  const today = rows.filter((r) => r.work_date === latestDate);
  const verified = today.filter((r) => r.status === "verified").length;
  const priority = rows.filter((r) => r.status === "inspection_priority").length;
  const avgHours = today.length
    ? Math.round((today.reduce((s, r) => s + Number(r.working_hours), 0) / today.length) * 10) / 10
    : 0;

  const byDate = [...new Set(rows.map((r) => r.work_date))]
    .sort()
    .slice(-10)
    .map((date) => {
      const day = rows.filter((r) => r.work_date === date);
      return {
        date: new Date(date).toLocaleDateString([], { day: "2-digit", month: "short" }),
        verified: day.filter((d) => d.status === "verified").length,
        review: day.filter((d) => d.status === "requires_review").length,
        priority: day.filter((d) => d.status === "inspection_priority").length,
      };
    });

  const hoursTrend = byDate.map((d, i) => {
    const date = [...new Set(rows.map((r) => r.work_date))].sort().slice(-10)[i];
    const day = rows.filter((r) => r.work_date === date);
    return {
      date: d.date,
      hours: day.length
        ? Math.round((day.reduce((s, r) => s + Number(r.working_hours), 0) / day.length) * 10) / 10
        : 0,
    };
  });

  const inspectionSplit = (
    ["completed", "partially_completed", "not_verified"] as const
  ).map((status) => ({
    name: INSPECTION_STATUS_META[status].label,
    value: insp.filter((i) => i.status === status).length,
    tone: INSPECTION_STATUS_META[status].tone,
  }));

  const byDept = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      const dept = r.employees?.department ?? "Unknown";
      if (r.status !== "verified") acc[dept] = (acc[dept] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([dept, flags]) => ({ dept, flags }));

  return (
    <AppShell
      title="Admin Dashboard"
      description={`Verification analytics${latestDate ? ` · latest cycle ${fmtDate(latestDate)}` : ""}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active staff"
          value={
            (employees.data?.filter((e) => e.is_active).length ?? 0) +
            localStaff.filter((s) => s.status === "active").length
          }
          icon={UserCheck}
          hint="On roster"
          index={0}
        />
        <StatCard
          label="Verified today"
          value={`${verified}/${today.length}`}
          icon={ClipboardCheck}
          tone="verified"
          hint="GPS + face verified"
          index={1}
        />
        <StatCard
          label="Avg working hours"
          value={avgHours}
          icon={Clock}
          hint="Latest cycle"
          index={2}
        />
        <StatCard
          label="Inspection priority"
          value={priority}
          icon={TriangleAlert}
          tone="priority"
          hint="Across last 2 weeks"
          index={3}
        />
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Attendance status by day">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="verified" stackId="a" fill={TONE_COLOR.verified} name="Verified" />
                <Bar dataKey="review" stackId="a" fill={TONE_COLOR.review} name="Review" />
                <Bar dataKey="priority" stackId="a" fill={TONE_COLOR.priority} name="Priority" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Average working hours trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hoursTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Activity verification outcomes">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={inspectionSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {inspectionSplit.map((slice) => (
                    <Cell key={slice.name} fill={TONE_COLOR[slice.tone]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Flagged attendance by department">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="dept"
                  width={130}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="flags" fill="var(--review)" name="Flagged records" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      <Panel title="Latest attendance exceptions" className="mt-4">
        <div className="divide-border divide-y">
          {rows
            .filter((r) => r.status !== "verified")
            .slice(0, 8)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.employees?.full_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {r.employees?.department} · {fmtDate(r.work_date)} · {r.working_hours} h
                  </p>
                </div>
                <StatusBadge
                  tone={ATTENDANCE_STATUS_META[r.status].tone}
                  label={ATTENDANCE_STATUS_META[r.status].label}
                />
              </div>
            ))}
        </div>
      </Panel>
    </AppShell>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface p-5 ${className ?? ""}`}>
      <h2 className="font-display mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
