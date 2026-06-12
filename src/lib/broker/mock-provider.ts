import type { BrokerPosition, BrokerProvider } from "./types";

// Renders the Today page without broker credentials. Returns a small set of
// open positions with lightly randomized floating P&L so the page feels live.
export class MockProvider implements BrokerProvider {
  readonly name = "mock";

  async getOpenPositions(): Promise<BrokerPosition[]> {
    const now = Date.now();
    const drift = () => Math.round((Math.random() - 0.45) * 80);

    return [
      {
        externalId: "mock-eurusd-1",
        symbol: "EUR/USD",
        direction: "LONG",
        entry: 1.0841,
        stopLoss: 1.0826,
        takeProfit: 1.0872,
        volume: 1.0,
        pnl: 180 + drift(),
        openedAt: new Date(now - 1000 * 60 * 60 * 2), // ~2h ago
      },
      {
        externalId: "mock-gbpjpy-1",
        symbol: "GBP/JPY",
        direction: "SHORT",
        entry: 194.82,
        stopLoss: 195.12,
        takeProfit: 194.18,
        volume: 0.5,
        pnl: -60 + drift(),
        openedAt: new Date(now - 1000 * 60 * 35), // ~35m ago
      },
      {
        externalId: "mock-xauusd-1",
        symbol: "XAU/USD",
        direction: "LONG",
        entry: 2342.1,
        stopLoss: 2336.8,
        takeProfit: 2358.4,
        volume: 0.2,
        pnl: 240 + drift(),
        openedAt: new Date(now - 1000 * 60 * 60 * 4), // ~4h ago
      },
    ];
  }
}
