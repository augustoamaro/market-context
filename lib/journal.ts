import { ContextSnapshot } from "@/types/market";

const STORAGE_KEY = "hsc_snapshots";
const DUPLICATE_WINDOW_MS = 60_000;

function read(): ContextSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContextSnapshot[]) : [];
  } catch {
    return [];
  }
}

function write(snapshots: ContextSnapshot[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export function getSnapshots(): ContextSnapshot[] {
  return read();
}

export function saveSnapshot(snapshot: ContextSnapshot): boolean {
  const snapshots = read();
  const duplicateKey = `${snapshot.pair}_${snapshot.timeframe}_${snapshot.signal}`;
  const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
  const isDuplicate = snapshots.some(
    (s) =>
      `${s.pair}_${s.timeframe}_${s.signal}` === duplicateKey &&
      new Date(s.timestamp).getTime() > cutoff
  );
  if (isDuplicate) return false;
  write([snapshot, ...snapshots]);
  return true;
}

export function updateSnapshot(id: string, patch: Partial<ContextSnapshot>): void {
  write(read().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function deleteSnapshot(id: string): void {
  write(read().filter((s) => s.id !== id));
}

export function exportSnapshots(): string {
  const snapshots = read();
  if (snapshots.length === 0) return "";

  const headers: Array<keyof ContextSnapshot> = [
    "id", "timestamp", "pair", "timeframe", "regime", "trend",
    "rangePosition", "rsi", "macdHistogram", "volumeRatioPct",
    "confidenceScore", "signal", "label", "decision", "result", "notes",
  ];

  const escape = (val: unknown) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = snapshots.map((s) =>
    headers.map((h) => escape(s[h])).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
