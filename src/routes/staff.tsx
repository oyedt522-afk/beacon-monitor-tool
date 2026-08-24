import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserCheck, Users, UserX } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nirikshan/AppShell";
import { StatCard } from "@/components/nirikshan/StatCard";
import { StatusBadge } from "@/components/nirikshan/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addStaff,
  removeStaff,
  updateStaff,
  useStaff,
  type StaffMember,
  type StaffStatus,
} from "@/lib/staff-store";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Management — Nirikshan" },
      {
        name: "description",
        content:
          "Add, edit and deactivate field staff members. The roster powers attendance marking and dashboard analytics.",
      },
      { property: "og:title", content: "Staff Management — Nirikshan" },
      {
        property: "og:description",
        content: "Maintain the field staff roster used across attendance and inspections.",
      },
    ],
  }),
  component: StaffPage,
});

type FormState = Omit<StaffMember, "id">;

const EMPTY: FormState = {
  fullName: "",
  staffId: "",
  role: "",
  phone: "",
  department: "",
  status: "active",
};

function StaffPage() {
  const staff = useStaff();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const counts = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((s) => s.status === "active").length,
      inactive: staff.filter((s) => s.status === "inactive").length,
    }),
    [staff],
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id);
    const { id: _id, ...rest } = member;
    setForm(rest);
    setOpen(true);
  }

  function submit() {
    if (!form.fullName.trim() || !form.staffId.trim()) {
      toast.error("Full name and Staff ID are required");
      return;
    }
    const duplicate = staff.some(
      (s) =>
        s.id !== editingId &&
        s.staffId.trim().toLowerCase() === form.staffId.trim().toLowerCase(),
    );
    if (duplicate) {
      toast.error("That Staff ID is already in use");
      return;
    }
    if (editingId) {
      updateStaff(editingId, form);
      toast.success("Staff member updated");
    } else {
      addStaff(form);
      toast.success("Staff member added");
    }
    setOpen(false);
  }

  return (
    <AppShell
      title="Staff Management"
      description="Roster of field staff available for attendance and inspections"
      actions={
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" /> Add New Member
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total members" value={counts.total} icon={Users} index={0} />
        <StatCard
          label="Active"
          value={counts.active}
          icon={UserCheck}
          tone="verified"
          index={1}
        />
        <StatCard
          label="Inactive"
          value={counts.inactive}
          icon={UserX}
          tone="review"
          index={2}
        />
      </div>

      <section className="card-surface mt-6 p-5">
        <h2 className="font-display mb-4 text-sm font-semibold">Staff roster</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-sm">
                    No staff members yet — add your first member.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{s.fullName}</TableCell>
                    <TableCell className="text-xs">{s.staffId}</TableCell>
                    <TableCell className="text-xs">{s.role || "—"}</TableCell>
                    <TableCell className="text-xs">{s.department || "—"}</TableCell>
                    <TableCell className="text-xs">{s.phone || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={s.status === "active" ? "verified" : "neutral"}
                        label={s.status === "active" ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${s.fullName}`}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${s.fullName}`}
                          onClick={() => {
                            removeStaff(s.id);
                            toast.success(`${s.fullName} removed`);
                          }}
                        >
                          <Trash2 className="text-priority size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit staff member" : "Add New Member"}</DialogTitle>
            <DialogDescription>
              Members added here appear in attendance marking and dashboard counters.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Ananya Deshmukh"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="staffId">Staff ID</Label>
              <Input
                id="staffId"
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                placeholder="e.g. NRK-1096"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role / Designation</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Junior Engineer"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 90000 00000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Rural Development"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as StaffStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Save changes" : "Add member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
