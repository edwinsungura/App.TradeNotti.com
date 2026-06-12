import type { JournalStats } from "./stats";

export interface GeneratedInsight {
  category: string; // short kicker e.g. "TIME", "EDGE", "RISK"
  text: string;
  source: "openai" | "stub";
}

const SYSTEM_PROMPT = `You are a trading-performance coach embedded in a trading journal app.
Given a JSON summary of a trader's recent closed-trade statistics, write ONE concise,
specific, encouraging insight (max 22 words) they can act on today.
Respond ONLY with strict JSON: {"category": "<ONE WORD KICKER>", "text": "<insight>"}.
The category is an uppercase kicker like TIME, EDGE, RISK, or DISCIPLINE.`;

/**
 * Generates the daily insight. Uses OpenAI when OPENAI_API_KEY is set; otherwise
 * falls back to a deterministic, data-driven stub. Both read the SAME journal
 * stats, so swapping in the real key changes only the phrasing.
 */
export async function generateDailyInsight(
  stats: JournalStats,
): Promise<GeneratedInsight> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      return await generateWithOpenAI(stats, apiKey);
    } catch (err) {
      console.error("[ai] OpenAI insight failed, using stub:", err);
    }
  }
  return generateStub(stats);
}

async function generateWithOpenAI(
  stats: JournalStats,
  apiKey: string,
): Promise<GeneratedInsight> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(stats) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { category?: string; text?: string };
  if (!parsed.text) throw new Error("OpenAI returned no insight text");

  return {
    category: (parsed.category || "INSIGHT").toUpperCase().slice(0, 16),
    text: parsed.text.trim(),
    source: "openai",
  };
}

/**
 * Deterministic insight derived from the journal stats. Picks the most
 * interesting signal available and phrases it. No external calls.
 */
export function generateStub(stats: JournalStats): GeneratedInsight {
  // 1) Session edge — the headline insight when present.
  if (stats.bestSession && stats.bestSession.edgeR >= 0.2) {
    const { session, over, edgeR } = stats.bestSession;
    return {
      category: "TIME",
      text: `Your ${session}-open trades outperform ${over} by +${edgeR.toFixed(
        1,
      )}R on average.`,
      source: "stub",
    };
  }

  // 2) Best setup by win rate / P&L.
  if (stats.bestSetup && stats.bestSetup.trades >= 2) {
    const s = stats.bestSetup;
    return {
      category: "EDGE",
      text: `"${s.tag}" is your strongest setup — ${Math.round(
        s.winRate * 100,
      )}% win rate across ${s.trades} trades. Prioritise it today.`,
      source: "stub",
    };
  }

  // 3) Overall expectancy fallback.
  if (stats.closedTrades >= 1) {
    const sign = stats.avgR >= 0 ? "+" : "";
    return {
      category: "EDGE",
      text: `${Math.round(stats.winRate * 100)}% win rate at ${sign}${stats.avgR.toFixed(
        2,
      )}R avg over ${stats.closedTrades} trades — keep your risk consistent.`,
      source: "stub",
    };
  }

  // 4) Cold start — no closed trades yet.
  return {
    category: "START",
    text: "No closed trades yet. Log your first trades and your edge insights will appear here.",
    source: "stub",
  };
}
