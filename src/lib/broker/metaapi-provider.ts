import type { BrokerConnection, BrokerPosition, BrokerProvider } from "./types";

// MetaTrader 5 (and MT4) live positions via MetaApi.cloud's REST API.
// MetaApi is a cloud bridge to a real MT terminal — MT5 itself has no public
// REST API, so a bridge is required when running off-Windows / in the cloud.
//
// Docs: https://metaapi.cloud/docs/client/restApi/
// Endpoint used: GET /users/current/accounts/{accountId}/positions
interface MetaApiRawPosition {
  id: string | number;
  symbol: string;
  type: string; // "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL"
  openPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  volume?: number;
  profit?: number;
  time: string; // ISO
}

export class MetaApiProvider implements BrokerProvider {
  readonly name = "metaapi";

  constructor(
    private readonly token: string,
    private readonly accountId: string,
    private readonly region: string = "new-york",
  ) {}

  private get baseUrl(): string {
    // Region-scoped MetaApi MetaTrader client API host.
    return `https://mt-client-api-v1.${this.region}.agiliumtrade.ai`;
  }

  async getOpenPositions(): Promise<BrokerPosition[]> {
    const res = await fetch(
      `${this.baseUrl}/users/current/accounts/${this.accountId}/positions`,
      {
        headers: { "auth-token": this.token, Accept: "application/json" },
        // Always hit the broker; never serve a stale cache here.
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `MetaApi positions request failed (${res.status}): ${body.slice(0, 200)}`,
      );
    }

    const raw = (await res.json()) as MetaApiRawPosition[];
    return raw.map((p) => normalizePosition(p));
  }
}

function normalizePosition(p: MetaApiRawPosition): BrokerPosition {
  return {
    externalId: String(p.id),
    symbol: normalizeSymbol(p.symbol),
    direction: p.type === "POSITION_TYPE_SELL" ? "SHORT" : "LONG",
    entry: p.openPrice,
    stopLoss: p.stopLoss ?? null,
    takeProfit: p.takeProfit ?? null,
    volume: p.volume ?? null,
    pnl: p.profit ?? null,
    openedAt: new Date(p.time),
  };
}

// "EURUSD" -> "EUR/USD" for common 6-char FX symbols; otherwise pass through.
function normalizeSymbol(symbol: string): string {
  const clean = symbol.toUpperCase().replace(/[^A-Z]/g, "");
  if (clean.length === 6) return `${clean.slice(0, 3)}/${clean.slice(3)}`;
  return symbol;
}

// Factory used by the broker registry; returns null when not configured.
export function createMetaApiProvider(
  connection: BrokerConnection,
): MetaApiProvider | null {
  const token = process.env.METAAPI_TOKEN;
  const accountId =
    connection.metaApiAccountId || process.env.METAAPI_ACCOUNT_ID;
  const region = process.env.METAAPI_REGION || "new-york";
  if (!token || !accountId) return null;
  return new MetaApiProvider(token, accountId, region);
}
