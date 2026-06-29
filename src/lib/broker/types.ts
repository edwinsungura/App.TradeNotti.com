// Normalized broker types. Adapters map a broker's native shape onto these so
// the rest of the app never depends on a specific broker/API.

export type BrokerDirection = "LONG" | "SHORT";

export interface BrokerPosition {
  // Stable id from the broker (used for idempotent upserts).
  externalId: string;
  symbol: string; // normalized, e.g. "EUR/USD"
  direction: BrokerDirection;
  entry: number;
  stopLoss: number | null;
  takeProfit: number | null;
  volume: number | null;
  // Floating/unrealized P&L in account currency.
  pnl: number | null;
  openedAt: Date;
}

// A closed, round-trip trade pulled from broker history.
export interface BrokerDeal {
  externalId: string; // broker position id (one round trip)
  symbol: string;
  direction: BrokerDirection;
  entry: number;
  exit: number | null;
  volume: number | null;
  // Net realized P&L incl. commission + swap, in account currency.
  pnl: number | null;
  openedAt: Date;
  closedAt: Date;
}

// Account-level figures from the broker (used for balance + ROI).
export interface BrokerAccountInfo {
  balance: number; // account balance in account currency
  equity: number | null;
  currency: string | null;
}

export interface BrokerProvider {
  readonly name: string;
  // Boot the broker terminal (on-demand). No-op for providers that don't need it.
  deploy(): Promise<void>;
  // Shut the terminal down so billing stops. Always safe to call.
  undeploy(): Promise<void>;
  // Currently OPEN positions for the linked account.
  getOpenPositions(): Promise<BrokerPosition[]>;
  // Closed trades since `since` (null = full history backfill).
  getClosedDeals(since: Date | null): Promise<BrokerDeal[]>;
  // Account balance/equity/currency. null when unavailable (leaves stored value).
  getAccountInformation(): Promise<BrokerAccountInfo | null>;
}

// Account-level connection details passed to a provider factory.
export interface BrokerConnection {
  metaApiAccountId?: string | null;
  brokerLogin?: string | null;
  brokerServer?: string | null;
}
