import { prisma } from "./db";
import type { RuleCategory } from "@prisma/client";

export interface RuleView {
  id: string;
  text: string;
  category: RuleCategory;
  order: number;
}

/**
 * Reads the active trading rules for an account. The Today page consumes this
 * read-only; the full rules-management experience is the separate Rules feature.
 */
export async function getRulesForAccount(
  accountId: string,
): Promise<RuleView[]> {
  const rules = await prisma.rule.findMany({
    where: { accountId, active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rules.map((r) => ({
    id: r.id,
    text: r.text,
    category: r.category,
    order: r.order,
  }));
}
