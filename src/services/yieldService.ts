import type { Address } from "viem";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_CHAIN_IDS,
  type SupportedAsset,
} from "../config/yieldConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YieldPool {
  id: string;
  protocol: "aave-v3" | "morpho";
  protocolLabel: string;
  chain: string;
  chainId: number;
  symbol: string;
  asset: SupportedAsset;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  liquidityUsd: number;
  poolAddress: Address;
  poolMeta: string | null;
  vaultName: string;
  isBest: boolean;
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

const MORPHO_GRAPHQL_URL = "https://blue-api.morpho.org/graphql";
const AAVE_V3_GRAPHQL_URL = "https://api.v3.aave.com/graphql";

// ---------------------------------------------------------------------------
// Chain ID → human-readable name (for display)
// ---------------------------------------------------------------------------

const CHAIN_NAME_MAP: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  56: "BNB Chain",
};

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let _morphoCache: { data: YieldPool[]; asset: string; ts: number } | null =
  null;
let _aaveCache: { data: YieldPool[]; asset: string; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Morpho Blue API — fetch vaults via official GraphQL
// ---------------------------------------------------------------------------

interface MorphoVaultRaw {
  address: string;
  name: string;
  symbol: string;
  avgApy: number;
  avgNetApy: number;
  liquidityUsd: number;
  totalAssetsUsd: number;
  chain: { id: number; network: string };
  asset: { address: string; symbol: string; decimals: number };
  rewards: { supplyApr: number; asset: { symbol: string } }[];
}

async function fetchMorphoVaults(asset: SupportedAsset): Promise<YieldPool[]> {
  if (
    _morphoCache &&
    _morphoCache.asset === asset &&
    Date.now() - _morphoCache.ts < CACHE_TTL_MS
  ) {
    return _morphoCache.data;
  }

  const supportedChainIds = SUPPORTED_CHAIN_IDS;

  const query = `{
    vaultV2s(
      first: 200,
      where: { chainId_in: [${supportedChainIds.join(",")}] }
    ) {
      items {
        address
        name
        symbol
        avgApy
        avgNetApy
        liquidityUsd
        totalAssetsUsd
        chain { id network }
        asset { address symbol decimals }
        rewards { supplyApr asset { symbol } }
      }
    }
  }`;

  console.log("[MaxYield] Fetching Morpho vaults from official API…");
  const res = await fetch(MORPHO_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Morpho API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const items: MorphoVaultRaw[] = json?.data?.vaultV2s?.items ?? [];
  console.log(`[MaxYield] Morpho API returned ${items.length} vaults`);

  const pools: YieldPool[] = [];

  for (const v of items) {
    // Filter by target asset
    const vaultAssetSymbol = v.asset.symbol.toUpperCase();
    if (!vaultAssetSymbol.includes(asset)) continue;

    // Must be on a supported chain
    const chainId = v.chain.id;
    if (!SUPPORTED_CHAINS[chainId]) continue;

    // Must have non-trivial TVL (> $100)
    if (v.totalAssetsUsd < 100) continue;

    // Base APY from the vault's average gross APY
    const baseApyPercent = (v.avgApy ?? 0) * 100;
    // Reward APY = sum of all reward supplyApr
    const rewardApyPercent =
      (v.rewards ?? []).reduce((sum, r) => sum + (r.supplyApr ?? 0), 0) * 100;
    const totalApyPercent = baseApyPercent + rewardApyPercent;

    if (totalApyPercent <= 0) continue;

    pools.push({
      id: `morpho-${v.address}-${chainId}`,
      protocol: "morpho",
      protocolLabel: "Morpho",
      chain: CHAIN_NAME_MAP[chainId] ?? `Chain ${chainId}`,
      chainId,
      symbol: v.asset.symbol,
      asset,
      apy: roundTo(totalApyPercent, 2),
      apyBase: roundTo(baseApyPercent, 2),
      apyReward: roundTo(rewardApyPercent, 2),
      tvlUsd: v.totalAssetsUsd,
      liquidityUsd: v.liquidityUsd,
      poolAddress: v.address as Address,
      poolMeta: null,
      vaultName: `${v.name} (Morph)`,
      isBest: false,
    });
  }

  _morphoCache = { data: pools, asset, ts: Date.now() };
  return pools;
}

// ---------------------------------------------------------------------------
// Aave V3 API — fetch reserves via official GraphQL
// ---------------------------------------------------------------------------

interface AaveIncentiveRaw {
  __typename: string;
  extraSupplyApr?: { value: string };
  rewardTokenSymbol?: string;
}

interface AaveReserveRaw {
  underlyingToken: { symbol: string; address: string; decimals: number };
  supplyInfo: { apy: { value: string }; total: { value: string } };
  size: { usd: string };
  incentives: AaveIncentiveRaw[];
}

interface AaveMarketRaw {
  name: string;
  chain: { chainId: number; name: string };
  address: string;
  reserves: AaveReserveRaw[];
}

async function fetchAaveReserves(asset: SupportedAsset): Promise<YieldPool[]> {
  if (
    _aaveCache &&
    _aaveCache.asset === asset &&
    Date.now() - _aaveCache.ts < CACHE_TTL_MS
  ) {
    return _aaveCache.data;
  }

  const supportedChainIds = SUPPORTED_CHAIN_IDS;

  const query = `{
    markets(request: { chainIds: [${supportedChainIds.join(",")}] }) {
      name
      chain { chainId name }
      address
      reserves {
        underlyingToken { symbol address decimals }
        supplyInfo { apy { value } total { value } }
        size { usd }
        incentives {
          ... on MeritSupplyIncentive { extraSupplyApr { value } }
          ... on AaveSupplyIncentive { extraSupplyApr { value } rewardTokenSymbol }
        }
      }
    }
  }`;

  console.log("[MaxYield] Fetching Aave V3 reserves from official API…");
  const res = await fetch(AAVE_V3_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Aave V3 API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const markets: AaveMarketRaw[] = json?.data?.markets ?? [];
  console.log(`[MaxYield] Aave V3 API returned ${markets.length} markets`);

  const pools: YieldPool[] = [];

  for (const market of markets) {
    const chainId = market.chain.chainId;
    const chainConfig = SUPPORTED_CHAINS[chainId];
    if (!chainConfig) continue;

    for (const reserve of market.reserves) {
      const sym = reserve.underlyingToken.symbol.toUpperCase();
      if (sym !== asset) continue;

      const baseApyPercent = parseFloat(reserve.supplyInfo.apy.value) * 100;

      // Sum all supply incentive APRs
      const rewardApyPercent = (reserve.incentives ?? []).reduce((sum, inc) => {
        const apr = inc.extraSupplyApr?.value
          ? parseFloat(inc.extraSupplyApr.value) * 100
          : 0;
        return sum + apr;
      }, 0);

      const totalApyPercent = baseApyPercent + rewardApyPercent;
      if (totalApyPercent <= 0) continue;

      const sizeUsd = parseFloat(reserve.size.usd) || 0;

      pools.push({
        id: `aave-${chainId}-${reserve.underlyingToken.address}`,
        protocol: "aave-v3",
        protocolLabel: "Aave V3",
        chain: CHAIN_NAME_MAP[chainId] ?? market.chain.name,
        chainId,
        symbol: reserve.underlyingToken.symbol,
        asset,
        apy: roundTo(totalApyPercent, 2),
        apyBase: roundTo(baseApyPercent, 2),
        apyReward: roundTo(rewardApyPercent, 2),
        tvlUsd: sizeUsd,
        liquidityUsd: sizeUsd,
        poolAddress: chainConfig.aaveV3Pool,
        poolMeta: market.name,
        vaultName: `${reserve.underlyingToken.symbol} Supply (Aave V3)`,
        isBest: false,
      });
    }
  }

  _aaveCache = { data: pools, asset, ts: Date.now() };
  return pools;
}

// ---------------------------------------------------------------------------
// Public API — merge Morpho + Aave, sort by APY
// ---------------------------------------------------------------------------

export async function fetchYieldPools(
  asset: SupportedAsset,
): Promise<YieldPool[]> {
  // Fetch both in parallel
  const [morphoPools, aavePools] = await Promise.all([
    fetchMorphoVaults(asset).catch((err) => {
      console.error("[MaxYield] Morpho fetch failed:", err);
      return [] as YieldPool[];
    }),
    fetchAaveReserves(asset).catch((err) => {
      console.error("[MaxYield] Aave fetch failed:", err);
      return [] as YieldPool[];
    }),
  ]);

  const pools = [...morphoPools, ...aavePools];

  // Sort by APY descending
  pools.sort((a, b) => b.apy - a.apy);

  // Mark the best pool
  if (pools.length > 0) {
    pools[0].isBest = true;
  }

  console.log(
    `[MaxYield] Combined: ${morphoPools.length} Morpho + ${aavePools.length} Aave = ${pools.length} total pools`,
  );

  return pools;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
