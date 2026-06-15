import { prisma } from "./db";
import type { RuleCategory } from "@prisma/client";

export interface RuleView {
  id: string;
  text: string;
  category: RuleCategory | null;
  order: number;
}

const toView = (r: {
  id: string;
  text: string;
  category: RuleCategory | null;
  order: number;
}): RuleView => ({ id: r.id, text: r.text, category: r.category, order: r.order });

/**
 * Reads the active trading rules for an account. Consumed by both the Today
 * page (read-only) and the Rules page (editable).
 */
export async function getRulesForAccount(
  accountId: string,
): Promise<RuleView[]> {
  const rules = await prisma.rule.findMany({
    where: { accountId, active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rules.map(toView);
}

/** Append a new rule to the end of the account's rulebook. */
export async function createRule(
  accountId: string,
  text: string,
): Promise<RuleView> {
  const last = await prisma.rule.findFirst({
    where: { accountId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const rule = await prisma.rule.create({
    data: { accountId, text, order: (last?.order ?? -1) + 1 },
  });
  return toView(rule);
}

/** Edit a rule's text (scoped to the account). */
export async function updateRule(
  accountId: string,
  id: string,
  text: string,
): Promise<RuleView | null> {
  const existing = await prisma.rule.findFirst({
    where: { id, accountId },
    select: { id: true },
  });
  if (!existing) return null;
  const rule = await prisma.rule.update({ where: { id }, data: { text } });
  return toView(rule);
}

/** Remove a rule (scoped to the account). */
export async function deleteRule(accountId: string, id: string): Promise<void> {
  await prisma.rule.deleteMany({ where: { id, accountId } });
}
