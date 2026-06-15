import { prisma } from "./db";
import type { NotificationType } from "@prisma/client";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationData[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function createNotification(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  },
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link,
    },
  });
}

export async function markRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
