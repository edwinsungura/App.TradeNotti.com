import { prisma } from "./db";
import type { PartnerAccess } from "@prisma/client";
import { createNotification } from "./notifications";

export type Access = "STATS" | "FULL";

export interface PartnerStats {
  weekNet: number;
  weekChange: number; // net change vs the previous week
  winRate: number | null;
  trades: number;
  spark: number[]; // cumulative equity points over the last 7 days
  lastActive: string | null; // relative label, e.g. "2h ago"
}

export interface PartnerCard {
  partnershipId: string;
  userId: string;
  name: string;
  username: string;
  access: Access; // what they share with me (what I can see)
  myAccess: Access; // what I share with them
  since: string;
  stats: PartnerStats;
}

export interface IncomingRequest {
  partnershipId: string;
  name: string;
  username: string;
  access: Access; // what they propose to share
  mutual: number;
  createdAt: string;
}

export interface OutgoingRequest {
  partnershipId: string;
  name: string;
  username: string;
  access: Access;
  createdAt: string;
}

export class PartnerError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function relativeTime(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Week-to-date stats for a user, aggregated across their accounts. */
async function statsForUser(userId: string): Promise<PartnerStats> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });
  const ids = accounts.map((a) => a.id);
  const empty: PartnerStats = {
    weekNet: 0,
    weekChange: 0,
    winRate: null,
    trades: 0,
    spark: [],
    lastActive: null,
  };
  if (ids.length === 0) return empty;

  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const twoWeeksAgo = new Date(Date.now() - 14 * 864e5);
  const trades = await prisma.trade.findMany({
    where: { accountId: { in: ids }, status: "CLOSED", closedAt: { gte: twoWeeksAgo } },
    orderBy: { closedAt: "asc" },
    select: { pnl: true, closedAt: true },
  });
  if (trades.length === 0) return empty;

  let weekNet = 0;
  let prevWeekNet = 0;
  let wins = 0;
  let weekTrades = 0;
  let run = 0;
  let lastActive: string | null = null;
  const spark: number[] = [];
  for (const t of trades) {
    const p = Number(t.pnl) || 0;
    if (t.closedAt && t.closedAt >= weekAgo) {
      weekNet += p;
      if (p > 0) wins++;
      weekTrades++;
      run += p;
      spark.push(run);
      lastActive = relativeTime(t.closedAt);
    } else {
      prevWeekNet += p;
    }
  }
  return {
    weekNet,
    weekChange: weekNet - prevWeekNet,
    winRate: weekTrades ? (wins / weekTrades) * 100 : null,
    trades: weekTrades,
    spark,
    lastActive,
  };
}

/** Set of userIds I'm in an accepted partnership with. */
async function acceptedPartnerIds(userId: string): Promise<Set<string>> {
  const links = await prisma.partnership.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const set = new Set<string>();
  for (const l of links) {
    set.add(l.requesterId === userId ? l.addresseeId : l.requesterId);
  }
  return set;
}

/** Everything the Partners page needs. */
export async function getPartnersData(userId: string): Promise<{
  partners: PartnerCard[];
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
}> {
  const links = await prisma.partnership.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, name: true, username: true } },
      addressee: { select: { id: true, name: true, username: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const partners: PartnerCard[] = [];
  const incoming: IncomingRequest[] = [];
  const outgoing: OutgoingRequest[] = [];
  const myPartners = await acceptedPartnerIds(userId);

  for (const l of links) {
    const iAmRequester = l.requesterId === userId;
    const other = iAmRequester ? l.addressee : l.requester;
    const theirAccess = (iAmRequester ? l.addresseeAccess : l.requesterAccess) as Access;
    const myAccess = (iAmRequester ? l.requesterAccess : l.addresseeAccess) as Access;

    if (l.status === "ACCEPTED") {
      partners.push({
        partnershipId: l.id,
        userId: other.id,
        name: other.name,
        username: other.username,
        access: theirAccess,
        myAccess,
        since: l.updatedAt.toISOString(),
        stats: await statsForUser(other.id),
      });
    } else if (l.status === "PENDING") {
      if (iAmRequester) {
        outgoing.push({
          partnershipId: l.id,
          name: other.name,
          username: other.username,
          access: myAccess,
          createdAt: l.createdAt.toISOString(),
        });
      } else {
        // mutual partners = intersection of accepted partners
        const theirPartners = await acceptedPartnerIds(other.id);
        let mutual = 0;
        for (const id of theirPartners) if (myPartners.has(id)) mutual++;
        incoming.push({
          partnershipId: l.id,
          name: other.name,
          username: other.username,
          access: l.requesterAccess as Access,
          mutual,
          createdAt: l.createdAt.toISOString(),
        });
      }
    }
  }

  return { partners, incoming, outgoing };
}

/** Send a partner invite by username. */
export async function sendInvite(
  userId: string,
  rawUsername: string,
  access: Access,
): Promise<void> {
  const username = rawUsername.replace(/^@/, "").trim().toLowerCase();
  if (!username) throw new PartnerError("INVALID", "Enter a username.");

  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (!target) throw new PartnerError("NOT_FOUND", "No trader with that username.");
  if (target.id === userId)
    throw new PartnerError("SELF", "You can't partner with yourself.");

  const existing = await prisma.partnership.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  });
  if (existing)
    throw new PartnerError("EXISTS", "You already have a link with this trader.");

  await prisma.partnership.create({
    data: {
      requesterId: userId,
      addresseeId: target.id,
      requesterAccess: access as PartnerAccess,
      status: "PENDING",
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true },
  });
  await createNotification(target.id, {
    type: "PARTNER_REQUEST",
    title: "New partner request",
    body: `${me?.name ?? "A trader"} (@${me?.username ?? "trader"}) wants to partner with you.`,
    link: "/partners",
  });
}

/** Accept or decline an incoming invite (must be the addressee). */
export async function respondInvite(
  userId: string,
  id: string,
  accept: boolean,
  access: Access = "STATS",
): Promise<void> {
  const link = await prisma.partnership.findFirst({
    where: { id, addresseeId: userId, status: "PENDING" },
    select: { id: true, requesterId: true },
  });
  if (!link) throw new PartnerError("NOT_FOUND", "Request not found.");

  if (accept) {
    await prisma.partnership.update({
      where: { id },
      data: { status: "ACCEPTED", addresseeAccess: access as PartnerAccess },
    });
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });
    await createNotification(link.requesterId, {
      type: "PARTNER_ACCEPTED",
      title: "Partner request accepted",
      body: `${me?.name ?? "A trader"} (@${me?.username ?? "trader"}) accepted your partner request.`,
      link: "/partners",
    });
  } else {
    await prisma.partnership.delete({ where: { id } });
  }
}

/** Remove a partner or cancel an outgoing invite. */
export async function removePartnership(userId: string, id: string): Promise<void> {
  await prisma.partnership.deleteMany({
    where: { id, OR: [{ requesterId: userId }, { addresseeId: userId }] },
  });
}

/** Change the access level I share with a partner. */
export async function updateMyAccess(
  userId: string,
  id: string,
  access: Access,
): Promise<void> {
  const link = await prisma.partnership.findFirst({
    where: { id, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { id: true, requesterId: true },
  });
  if (!link) throw new PartnerError("NOT_FOUND", "Partner not found.");
  const field =
    link.requesterId === userId ? "requesterAccess" : "addresseeAccess";
  await prisma.partnership.update({
    where: { id },
    data: { [field]: access as PartnerAccess },
  });
}
