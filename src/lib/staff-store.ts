import { useSyncExternalStore } from "react";

export type StaffStatus = "active" | "inactive";

export type StaffMember = {
  id: string;
  fullName: string;
  staffId: string;
  role: string;
  phone: string;
  department: string;
  status: StaffStatus;
};

const KEY = "nirikshan.staff.v1";

export const SEED_STAFF: StaffMember[] = [
  {
    id: "seed-1",
    fullName: "Ananya Deshmukh",
    staffId: "NRK-1041",
    role: "Block Development Officer",
    phone: "+91 98220 41288",
    department: "Rural Development",
    status: "active",
  },
  {
    id: "seed-2",
    fullName: "Rohit Kulkarni",
    staffId: "NRK-1052",
    role: "Junior Engineer",
    phone: "+91 90110 77324",
    department: "Public Works",
    status: "active",
  },
  {
    id: "seed-3",
    fullName: "Sneha Patil",
    staffId: "NRK-1063",
    role: "Health Supervisor",
    phone: "+91 93715 20946",
    department: "Health & Sanitation",
    status: "active",
  },
  {
    id: "seed-4",
    fullName: "Imran Shaikh",
    staffId: "NRK-1074",
    role: "Field Inspector",
    phone: "+91 82910 66551",
    department: "Water Resources",
    status: "inactive",
  },
  {
    id: "seed-5",
    fullName: "Meera Iyer",
    staffId: "NRK-1085",
    role: "Scheme Coordinator",
    phone: "+91 99204 31877",
    department: "Social Welfare",
    status: "active",
  },
];

let cache: StaffMember[] = SEED_STAFF;
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cache));
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StaffMember[];
      if (Array.isArray(parsed)) cache = parsed;
    } else {
      persist();
    }
  } catch {
    cache = SEED_STAFF;
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): StaffMember[] {
  load();
  return cache;
}

export function useStaff(): StaffMember[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => SEED_STAFF);
}

export function addStaff(input: Omit<StaffMember, "id" | "status"> & { status?: StaffStatus }) {
  cache = [
    ...cache,
    {
      ...input,
      status: input.status ?? "active",
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `staff-${Date.now()}`,
    },
  ];
  emit();
}

export function updateStaff(id: string, patch: Partial<Omit<StaffMember, "id">>) {
  cache = cache.map((s) => (s.id === id ? { ...s, ...patch } : s));
  emit();
}

export function removeStaff(id: string) {
  cache = cache.filter((s) => s.id !== id);
  emit();
}
