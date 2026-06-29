import { prisma } from "./db";

export type DayStatus = "done" | "missed" | null;

export interface HabitStat {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  days: DayStatus[]; // length = days in month; index 0 = day 1
  doneCount: number; // completions this month
  currentStreak: number;
  longestStreak: number;
  doneToday: boolean;
}

export interface MonthGrid {
  year: number;
  month: number; // 0-11
  daysInMonth: number;
  todayDay: number | null; // 1-based if today falls in this month, else null
  relation: "past" | "current" | "future";
  habits: HabitStat[];
  completionPct: number; // overall % of cells done, up to today
}

const pad = (n: number) => String(n).padStart(2, "0");
const ds = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

function addDays(dstr: string, delta: number): string {
  const [y, m, d] = dstr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return ds(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

function todayStr(): string {
  const t = new Date();
  return ds(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

// Current streak (consecutive days ending today, or yesterday if today isn't
// marked yet) and the longest streak ever, from a set of done dates.
function computeStreaks(done: Set<string>): { current: number; longest: number } {
  const sorted = [...done].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const cur of sorted) {
    run = prev && addDays(prev, 1) === cur ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = cur;
  }

  const today = todayStr();
  let anchor = today;
  if (!done.has(anchor)) {
    const yesterday = addDays(today, -1);
    if (done.has(yesterday)) anchor = yesterday;
    else return { current: 0, longest };
  }
  let current = 0;
  let cur = anchor;
  while (done.has(cur)) {
    current += 1;
    cur = addDays(cur, -1);
  }
  return { current, longest };
}

export async function getHabitGrid(
  userId: string,
  year: number,
  month: number,
): Promise<MonthGrid> {
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { entries: { select: { date: true, status: true } } },
  });

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const today = todayStr();
  const [ty, tm, td] = today.split("-").map(Number);
  const todayDay = ty === year && tm - 1 === month ? td : null;

  const cmp = year * 12 + month - (ty * 12 + (tm - 1));

  // Consistency % is based on what you actually marked: done ticks over the
  // total marks (done ✓ + missed ✗). Unmarked days don't count either way.
  let doneMarks = 0;
  let totalMarks = 0;

  const out: HabitStat[] = habits.map((h) => {
    const byDate = new Map(h.entries.map((e) => [e.date, e.status]));
    const doneSet = new Set(
      h.entries.filter((e) => e.status === "done").map((e) => e.date),
    );
    const days: DayStatus[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const s = byDate.get(ds(year, month, d));
      days.push(s === "done" ? "done" : s === "missed" ? "missed" : null);
    }
    const { current, longest } = computeStreaks(doneSet);

    doneMarks += days.filter((s) => s === "done").length;
    totalMarks += days.filter((s) => s === "done" || s === "missed").length;

    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      order: h.order,
      days,
      doneCount: days.filter((s) => s === "done").length,
      currentStreak: current,
      longestStreak: longest,
      doneToday: doneSet.has(today),
    };
  });

  return {
    year,
    month,
    daysInMonth,
    todayDay,
    relation: cmp < 0 ? "past" : cmp > 0 ? "future" : "current",
    habits: out,
    completionPct:
      totalMarks > 0 ? Math.round((doneMarks / totalMarks) * 100) : 0,
  };
}

export const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function createHabit(
  userId: string,
  data: { name: string; emoji?: string; color?: string },
) {
  const order = await prisma.habit.count({ where: { userId, archived: false } });
  return prisma.habit.create({
    data: {
      userId,
      name: data.name.trim().slice(0, 60) || "New habit",
      emoji: (data.emoji || "✅").slice(0, 8),
      color: data.color || "#5b4ef5",
      order,
    },
  });
}

export async function updateHabit(
  userId: string,
  id: string,
  data: { name?: string; emoji?: string; color?: string; order?: number; archived?: boolean },
) {
  const owned = await prisma.habit.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return null;
  return prisma.habit.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim().slice(0, 60) } : {}),
      ...(data.emoji !== undefined ? { emoji: data.emoji.slice(0, 8) } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.archived !== undefined ? { archived: data.archived } : {}),
    },
  });
}

export async function deleteHabit(userId: string, id: string): Promise<boolean> {
  const owned = await prisma.habit.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return false;
  await prisma.habit.delete({ where: { id } });
  return true;
}

// Cycle a habit's mark for a day: none -> done (✓) -> missed (✗) -> none.
// Returns the new status, or null-result if the habit isn't the user's.
export async function cycleEntry(
  userId: string,
  id: string,
  date: string,
): Promise<{ status: DayStatus } | null> {
  const owned = await prisma.habit.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return null;
  const existing = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId: id, date } },
    select: { id: true, status: true },
  });
  if (!existing) {
    await prisma.habitEntry.create({ data: { habitId: id, date, status: "done" } });
    return { status: "done" };
  }
  if (existing.status === "done") {
    await prisma.habitEntry.update({
      where: { id: existing.id },
      data: { status: "missed" },
    });
    return { status: "missed" };
  }
  await prisma.habitEntry.delete({ where: { id: existing.id } });
  return { status: null };
}
