import { prisma } from "./db";
import type { AccountType } from "@prisma/client";

const MAX_AVATAR = 2_000_000;

export interface ProfileData {
  name: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export interface ManagedAccount {
  id: string;
  label: string;
  broker: string;
  currency: string;
  type: AccountType;
  balance: number;
  archived: boolean;
  connected: boolean;
  brokerLogin: string | null;
  lastSyncedAt: string | null;
  syncStatus: string;
}

export interface ProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface AccountInput {
  label?: string;
  broker?: string;
  currency?: string;
  type?: AccountType;
  balance?: number;
  archived?: boolean;
}

export class SettingsError extends Error {}

export async function getProfile(userId: string): Promise<ProfileData | null> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return { name: u.name, email: u.email, username: u.username, avatarUrl: u.avatarUrl };
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
): Promise<ProfileData> {
  // Email is intentionally NOT editable — ignored even if supplied.
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new SettingsError("Name can't be empty.");
    data.name = name;
  }
  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl && !input.avatarUrl.startsWith("data:image/"))
      throw new SettingsError("Invalid image.");
    if (input.avatarUrl && input.avatarUrl.length > MAX_AVATAR)
      throw new SettingsError("Image too large.");
    data.avatarUrl = input.avatarUrl;
  }

  try {
    const u = await prisma.user.update({ where: { id: userId }, data });
    return { name: u.name, email: u.email, username: u.username, avatarUrl: u.avatarUrl };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      throw new SettingsError("That email is already in use.");
    }
    throw e;
  }
}

export async function listManagedAccounts(userId: string): Promise<ManagedAccount[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
  });
  return accounts.map((a) => ({
    id: a.id,
    label: a.label,
    broker: a.broker,
    currency: a.currency,
    type: a.type,
    balance: Number(a.balance),
    archived: a.archived,
    connected: !!a.metaApiAccountId,
    brokerLogin: a.brokerLogin,
    lastSyncedAt: a.lastSyncedAt ? a.lastSyncedAt.toISOString() : null,
    syncStatus: a.syncStatus,
  }));
}

const cleanType = (t?: AccountType) => (t === "DEMO" ? "DEMO" : "LIVE");

export async function createAccount(
  userId: string,
  input: AccountInput,
): Promise<ManagedAccount> {
  const label = input.label?.trim();
  if (!label) throw new SettingsError("Account name is required.");
  const a = await prisma.account.create({
    data: {
      userId,
      label,
      broker: input.broker?.trim() || "MetaTrader 5",
      currency: input.currency?.trim().toUpperCase() || "USD",
      type: cleanType(input.type),
      balance: input.balance ?? 0,
    },
  });
  return {
    id: a.id,
    label: a.label,
    broker: a.broker,
    currency: a.currency,
    type: a.type,
    balance: Number(a.balance),
    archived: a.archived,
    connected: !!a.metaApiAccountId,
    brokerLogin: a.brokerLogin,
    lastSyncedAt: a.lastSyncedAt ? a.lastSyncedAt.toISOString() : null,
    syncStatus: a.syncStatus,
  };
}

export async function updateAccount(
  userId: string,
  id: string,
  input: AccountInput,
): Promise<ManagedAccount | null> {
  const existing = await prisma.account.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) throw new SettingsError("Account name is required.");
    data.label = label;
  }
  if (input.broker !== undefined) data.broker = input.broker.trim() || "MetaTrader 5";
  if (input.currency !== undefined) data.currency = input.currency.trim().toUpperCase() || "USD";
  if (input.type !== undefined) data.type = cleanType(input.type);
  if (input.balance !== undefined) data.balance = input.balance;
  if (input.archived !== undefined) data.archived = input.archived;

  const a = await prisma.account.update({ where: { id }, data });
  return {
    id: a.id,
    label: a.label,
    broker: a.broker,
    currency: a.currency,
    type: a.type,
    balance: Number(a.balance),
    archived: a.archived,
    connected: !!a.metaApiAccountId,
    brokerLogin: a.brokerLogin,
    lastSyncedAt: a.lastSyncedAt ? a.lastSyncedAt.toISOString() : null,
    syncStatus: a.syncStatus,
  };
}

export async function deleteAccount(userId: string, id: string): Promise<void> {
  await prisma.account.deleteMany({ where: { id, userId } });
}
