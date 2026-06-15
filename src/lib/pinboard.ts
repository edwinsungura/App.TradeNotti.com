import { prisma } from "./db";
import type { PinDirection } from "@prisma/client";

export interface PinData {
  id: string;
  image: string;
  symbol: string | null;
  timeframe: string | null;
  direction: PinDirection | null;
  note: string | null;
  tags: string[];
  createdAt: string;
}

export interface PinInput {
  image?: string;
  symbol?: string | null;
  timeframe?: string | null;
  direction?: PinDirection | null;
  note?: string | null;
  tags?: string[];
}

const MAX_IMAGE = 4_000_000;

function toView(p: {
  id: string;
  image: string;
  symbol: string | null;
  timeframe: string | null;
  direction: PinDirection | null;
  note: string | null;
  tags: string[];
  createdAt: Date;
}): PinData {
  return {
    id: p.id,
    image: p.image,
    symbol: p.symbol,
    timeframe: p.timeframe,
    direction: p.direction,
    note: p.note,
    tags: p.tags,
    createdAt: p.createdAt.toISOString(),
  };
}

const clean = (s?: string | null) => {
  const t = s?.trim();
  return t ? t : null;
};
const dir = (d?: PinDirection | null) =>
  d === "LONG" || d === "SHORT" ? d : null;
const cleanTags = (t?: string[]) =>
  [...new Set((t ?? []).map((x) => x.trim()).filter(Boolean))].slice(0, 12);

export async function listPins(userId: string): Promise<PinData[]> {
  const pins = await prisma.pin.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return pins.map(toView);
}

export async function createPin(
  userId: string,
  input: PinInput,
): Promise<PinData> {
  if (!input.image || !input.image.startsWith("data:image/")) {
    throw new Error("A chart image is required.");
  }
  if (input.image.length > MAX_IMAGE) {
    throw new Error("Image too large.");
  }
  const pin = await prisma.pin.create({
    data: {
      userId,
      image: input.image,
      symbol: clean(input.symbol),
      timeframe: clean(input.timeframe),
      direction: dir(input.direction),
      note: clean(input.note),
      tags: cleanTags(input.tags),
    },
  });
  return toView(pin);
}

export async function updatePin(
  userId: string,
  id: string,
  input: PinInput,
): Promise<PinData | null> {
  const existing = await prisma.pin.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;
  const pin = await prisma.pin.update({
    where: { id },
    data: {
      symbol: clean(input.symbol),
      timeframe: clean(input.timeframe),
      direction: dir(input.direction),
      note: clean(input.note),
      tags: cleanTags(input.tags),
    },
  });
  return toView(pin);
}

export async function deletePin(userId: string, id: string): Promise<void> {
  await prisma.pin.deleteMany({ where: { id, userId } });
}
