import type { BrokerConnection, BrokerProvider } from "./types";
import { MockProvider } from "./mock-provider";
import { createMetaApiProvider } from "./metaapi-provider";

export type {
  BrokerProvider,
  BrokerPosition,
  BrokerDeal,
  BrokerConnection,
} from "./types";
export { provisionMetaApiAccount } from "./metaapi-provider";

export function brokerMode(): "metaapi" | "mock" {
  return (process.env.BROKER_PROVIDER || "mock").toLowerCase() === "metaapi"
    ? "metaapi"
    : "mock";
}

// Resolves the broker provider for an account. Controlled by BROKER_PROVIDER:
//   - "metaapi": live MT5 via MetaApi (falls back to mock if not configured)
//   - "mock" (default): seeded open positions, no credentials needed
export function getBrokerProvider(
  connection: BrokerConnection = {},
): BrokerProvider {
  const choice = (process.env.BROKER_PROVIDER || "mock").toLowerCase();

  if (choice === "metaapi") {
    const provider = createMetaApiProvider(connection);
    if (provider) return provider;
    // Misconfigured live mode — degrade to mock rather than break the page.
    console.warn(
      "[broker] BROKER_PROVIDER=metaapi but METAAPI_TOKEN/account id missing; using mock.",
    );
  }

  return new MockProvider();
}
