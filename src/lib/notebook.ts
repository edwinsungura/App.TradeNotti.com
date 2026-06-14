import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export interface NoteData {
  id: string;
  date: string;
  title: string;
  content: Prisma.JsonValue | null;
  updatedAt: string;
}

export interface TemplateData {
  id: string;
  name: string;
  content: Prisma.JsonValue | null;
  updatedAt: string;
}

const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isValidDate = (d: string) => VALID_DATE.test(d);

/** The single note attached to a given calendar day (or null). */
export async function getNote(
  userId: string,
  date: string,
): Promise<NoteData | null> {
  const note = await prisma.note.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!note) return null;
  return {
    id: note.id,
    date: note.date,
    title: note.title,
    content: note.content,
    updatedAt: note.updatedAt.toISOString(),
  };
}

/** Create or update a day's note. */
export async function upsertNote(
  userId: string,
  date: string,
  data: { title?: string; content?: Prisma.InputJsonValue | null },
): Promise<NoteData> {
  const content =
    data.content === null
      ? Prisma.JsonNull
      : (data.content as Prisma.InputJsonValue | undefined);

  const note = await prisma.note.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      title: data.title ?? "",
      ...(content !== undefined ? { content } : {}),
    },
    update: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(content !== undefined ? { content } : {}),
    },
  });
  return {
    id: note.id,
    date: note.date,
    title: note.title,
    content: note.content,
    updatedAt: note.updatedAt.toISOString(),
  };
}

export interface MonthNote {
  date: string;
  title: string;
}

/** Notes within a month (date + title) for calendar previews. */
export async function getMonthNotes(
  userId: string,
  ym: string, // "YYYY-MM"
): Promise<MonthNote[]> {
  const notes = await prisma.note.findMany({
    where: { userId, date: { startsWith: `${ym}-` } },
    select: { date: true, title: true },
  });
  return notes.map((n) => ({ date: n.date, title: n.title }));
}

export async function listTemplates(userId: string): Promise<TemplateData[]> {
  const rows = await prisma.noteTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    content: t.content,
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function createTemplate(
  userId: string,
  name: string,
  content: Prisma.InputJsonValue,
): Promise<TemplateData> {
  const t = await prisma.noteTemplate.create({
    data: { userId, name, content },
  });
  return {
    id: t.id,
    name: t.name,
    content: t.content,
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await prisma.noteTemplate.deleteMany({ where: { id, userId } });
}
