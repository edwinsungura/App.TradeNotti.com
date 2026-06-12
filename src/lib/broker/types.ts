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

export interface BrokerProvider {
  readonly name: string;
  // Returns currently OPEN positions for the linked account.
  getOpenPositions(): Promise<BrokerPosition[]>;
}

// Account-level connection details passed to a provider factory.
export interface BrokerConnection {
  metaApiAccountId?: string | null;
  brokerLogin?: string | null;
  brokerServer?: string | null;
}
