import type { Address } from "viem";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAIN_IDS,
  type SupportedAsset,
} from "../config/yieldConfig";
import type { YieldPool } from "./yieldService";

// ---------------------------------------------------------------------------
// Aave V3 GraphQL API — accurate real-time reserve data
// ---------------------------------------------------------------------------

const AAVE_GQL_URL = "https://api.v3.aave.com/graphql";

const AAVE_MARKETS_QUERY = `{
  markets(request: { chainIds: [${SUPPORTED_CHAIN_IDS.join(",")}] }) {
    name
    chain { chainId name }
    reserves {
      underlyingToken { symbol address }
      supplyInfo { apy { value } }
      size { usd }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Types for the GraphQL response
// ---------------------------------------------------------------------------

interface AaveGqlReserve {
  underlyingToken: { symbol: string; address: string };
  supplyInfo: { apy: { value: string } };
  size: { usd: string };
}

interface AaveGqlMarket {
  name: string;
  chain: { chainId: number; name: string };
  reserves: AaveGqlReserve[];
}

interface AaveGqlResponse {
  data: { markets: AaveGqlMarket[] } | null;
  errors?: { message: string }[];
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let _aaveCache: { pools: YieldPool[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Chain name mapping (Aave API chain name → our chain ID)
// The API returns chainId directly, but we also keep a name map as fallback
// ---------------------------------------------------------------------------

const AAVE_CHAIN_NAME_MAP: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Optimism: 10,
  Polygon: 137,
  "BNB Chain": 56,
  Bnb: 56,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAaveYieldPools(
  asset: SupportedAsset,
): Promise<YieldPool[]> {
  // Return from cache if fresh
  if (_aaveCache && Date.now() - _aaveCache.ts < CACHE_TTL_MS) {
    return _aaveCache.pools.filter((p) => p.asset === asset);
  }

  console.log("[MaxYield] Fetching Aave V3 data from official GraphQL API…");

  const res = await fetch(AAVE_GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: AAVE_MARKETS_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Aave API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as AaveGqlResponse;

  if (json.errors?.length) {
    console.error("[MaxYield] Aave GraphQL errors:", json.errors);
    throw new Error(`Aave GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data?.markets) {
    throw new Error("Aave API returned no market data");
  }

  const allPools: YieldPool[] = [];

  for (const market of json.data.markets) {
    const chainId = market.chain.chainId ?? AAVE_CHAIN_NAME_MAP[market.chain.name];
    if (!chainId || !SUPPORTED_CHAIN_IDS.includes(chainId)) continue;

    const chainConfig = SUPPORTED_CHAINS[chainId];
    if (!chainConfig) continue;

    for (const reserve of market.reserves) {
      const symbol = reserve.underlyingToken.symbol.toUpperCase();

      // Only include USDC and USDT
      let poolAsset: SupportedAsset | null = null;
      if (symbol === "USDC") poolAsset = "USDC";
      else if (symbol === "USDT") poolAsset = "USDT";
      if (!poolAsset) continue;

      // Verify the token exists in our config for this chain
      if (!chainConfig.tokens[poolAsset]) continue;

      const apyDecimal = parseFloat(reserve.supplyInfo.apy.value);
      const apyPercent = roundTo(apyDecimal * 100, 2);
      const tvlUsd = parseFloat(reserve.size.usd);

      // Skip zero/negative APY
      if (apyPercent <= 0) continue;

      allPools.push({
        id: `aave-v3-${chainId}-${poolAsset}`,
        protocol: "aave-v3",
        protocolLabel: "Aave V3",
        vaultName: `${poolAsset} Supply (Aave V3)`,
        chain: chainConfig.name,
        chainId,
        symbol: poolAsset,
        asset: poolAsset,
        apy: apyPercent,
        apyBase: apyPercent,
        apyReward: 0,
        tvlUsd,
        poolAddress: chainConfig.aaveV3Pool as Address,
        poolMeta: null,
        isBest: false,
      });
    }
  }

  console.log(`[MaxYield] Aave V3: fetched ${allPools.length} pools across all chains`);

  // Cache all pools (both USDC and USDT)
  _aaveCache = { pools: allPools, ts: Date.now() };

  return allPools.filter((p) => p.asset === asset);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
