import type { Address } from "viem";
import {
  DEFI_LLAMA_CHAIN_MAP,
  SUPPORTED_CHAINS,
  SUPPORTED_CHAIN_IDS,
  type SupportedAsset,
} from "../config/yieldConfig";
import { fetchAaveYieldPools } from "./aaveService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoolPrediction {
  predictedClass: string | null;
  predictedProbability: number | null;
  binnedConfidence: number | null;
}

export interface YieldPool {
  id: string;
  protocol: "aave-v3" | "morpho";
  protocolLabel: string;
  vaultName: string;
  chain: string;
  chainId: number;
  symbol: string;
  asset: SupportedAsset;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  poolAddress: Address;
  poolMeta: string | null;
  poolId: string;
  predictions: PoolPrediction | null;
  isBest: boolean;
}

interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  underlyingTokens: string[] | null;
  poolMeta: string | null;
  predictions: {
    predictedClass: string | null;
    predictedProbability: number | null;
    binnedConfidence: number | null;
  } | null;
}

// ---------------------------------------------------------------------------
// DeFi Llama API
// ---------------------------------------------------------------------------

const DEFI_LLAMA_POOLS_URL = "https://yields.llama.fi/pools";

// Only fetch Morpho from DeFi Llama (Aave V3 comes from aaveService)
const PROJECT_FILTER = new Set(["morpho-v1"]);

const PROTOCOL_LABEL_MAP: Record<string, string> = {
  "morpho-v1": "Morpho",
};

const PROTOCOL_KEY_MAP: Record<string, YieldPool["protocol"]> = {
  "morpho-v1": "morpho",
};

// ---------------------------------------------------------------------------
// Cache to avoid hammering the API
// ---------------------------------------------------------------------------

let _cache: { data: DefiLlamaPool[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

async function fetchAllPools(): Promise<DefiLlamaPool[]> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }

  const res = await fetch(DEFI_LLAMA_POOLS_URL);
  if (!res.ok) {
    throw new Error(`DeFi Llama API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { status: string; data: DefiLlamaPool[] };
  _cache = { data: json.data, ts: Date.now() };
  return json.data;
}

// ---------------------------------------------------------------------------
// Resolve the on-chain deposit address for a given pool
// ---------------------------------------------------------------------------

const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

function resolvePoolAddress(pool: DefiLlamaPool, chainId: number): Address {
  const chainConfig = SUPPORTED_CHAINS[chainId];
  if (!chainConfig) return ZERO_ADDRESS;

  if (pool.project === "aave-v3") {
    return chainConfig.aaveV3Pool;
  }

  // 1. Best match: by DeFi Llama pool UUID
  const byPoolId = chainConfig.morphoVaults.find((v) => v.poolId === pool.pool);
  if (byPoolId) return byPoolId.vaultAddress;

  // 2. Fallback: match by vault name
  const asset = extractAssetSymbol(pool.symbol);
  const readableName = VAULT_NAME_MAP[pool.symbol.toUpperCase()];

  if (readableName) {
    const byName = chainConfig.morphoVaults.find(
      (v) => v.name === readableName && v.asset === asset,
    );
    if (byName) return byName.vaultAddress;
  }

  // 3. Fallback: first vault matching the asset on this chain
  const byAsset = chainConfig.morphoVaults.find((v) => v.asset === asset);
  if (byAsset) return byAsset.vaultAddress;

  console.warn(
    `[MaxYield] No vault address for Morpho pool "${pool.symbol}" (poolId: ${pool.pool}) on chain ${chainId} — skipping`,
  );
  return ZERO_ADDRESS;
}

// ---------------------------------------------------------------------------
// Extract normalised asset symbol from DeFi Llama symbol field
// e.g. "USDC" | "USDC.e" | "USDC-USDT" → "USDC"
// ---------------------------------------------------------------------------

function extractAssetSymbol(symbol: string): SupportedAsset | null {
  const upper = symbol.toUpperCase();
  if (upper.includes("USDC")) return "USDC";
  if (upper.includes("USDT")) return "USDT";
  return null;
}

// ---------------------------------------------------------------------------
// Map DeFi Llama symbol to a human-readable vault/pool name
// ---------------------------------------------------------------------------

const VAULT_NAME_MAP: Record<string, string> = {
  STEAKUSDC: "Steakhouse USDC",
  STEAKUSDT: "Steakhouse USDT",
  STEAKUSDTBETHENA: "Steakhouse USDT Ethena",
  GTUSDCP: "Gauntlet USDC Prime",
  GTUSDCF: "Gauntlet USDC Flagship",
  GTUSDC: "Gauntlet USDC",
  GTUSDTF: "Gauntlet USDT Flagship",
  GTUSDCCORE: "Gauntlet USDC Core",
  BBQUSDC: "BBQ USDC",
  BBQUSDT: "BBQ USDT",
  BBQUSDT0: "BBQ USDT",
  VBGTUSDT: "Vault USDT",
  SYRUPUSDC: "Syrup USDC",
  SYRUPUSDT: "Syrup USDT",
};

function formatVaultName(
  rawSymbol: string,
  project: string,
  asset: SupportedAsset,
): string {
  const upper = rawSymbol.toUpperCase();

  // Aave V3: simple supply pool
  if (project === "aave-v3") {
    return `${asset} Supply (Aave V3)`;
  }

  // Morpho: try known vault names first
  const known = VAULT_NAME_MAP[upper];
  if (known) {
    return `${known} (Morpho)`;
  }

  // Fallback: clean up the raw symbol into something readable
  // e.g. "AA-FALCONXUSDC" → "Falcon X USDC"
  let cleaned = rawSymbol
    .replace(/USDC/gi, "")
    .replace(/USDT/gi, "")
    .replace(/^AA-/i, "")
    .replace(/[_-]/g, " ")
    .trim();

  if (cleaned.length === 0) {
    cleaned = rawSymbol;
  }

  return `${cleaned} ${asset} (Morpho)`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchYieldPools(
  asset: SupportedAsset,
): Promise<YieldPool[]> {
  // Fetch Aave V3 (official GraphQL) and Morpho (DeFi Llama) in parallel
  const [aavePools, morphoPools] = await Promise.all([
    fetchAaveYieldPools(asset).catch((err) => {
      console.error(
        "[MaxYield] Aave API fetch failed, falling back to empty:",
        err,
      );
      return [] as YieldPool[];
    }),
    fetchMorphoPools(asset),
  ]);

  // Merge both sources
  const pools = [...aavePools, ...morphoPools];

  // Sort by APY descending
  pools.sort((a, b) => b.apy - a.apy);

  // Mark the best pool
  if (pools.length > 0) {
    pools[0].isBest = true;
  }

  console.log(
    `[MaxYield] Total pools: ${pools.length} (Aave: ${aavePools.length}, Morpho: ${morphoPools.length})`,
  );
  return pools;
}

// ---------------------------------------------------------------------------
// Fetch Morpho pools from DeFi Llama
// ---------------------------------------------------------------------------

async function fetchMorphoPools(asset: SupportedAsset): Promise<YieldPool[]> {
  const allPools = await fetchAllPools();

  const supportedChainNames = new Set(Object.keys(DEFI_LLAMA_CHAIN_MAP));

  const filtered = allPools.filter((p) => {
    // Must be a supported protocol (Morpho only)
    if (!PROJECT_FILTER.has(p.project)) return false;

    // Must be on a supported chain
    if (!supportedChainNames.has(p.chain)) return false;

    // Must contain the target asset (single-asset pools only)
    const poolAsset = extractAssetSymbol(p.symbol);
    if (poolAsset !== asset) return false;

    // Skip multi-asset LP pools (we want single supply pools)
    if (p.symbol.includes("-") && !p.symbol.startsWith(asset)) return false;

    // Must have positive APY
    if (!p.apy || p.apy <= 0) return false;

    // Chain must be in our supported list
    const chainId = DEFI_LLAMA_CHAIN_MAP[p.chain];
    if (!chainId || !SUPPORTED_CHAIN_IDS.includes(chainId)) return false;

    // The asset must exist on that chain in our config
    const tokenConfig = SUPPORTED_CHAINS[chainId]?.tokens[asset];
    if (!tokenConfig) return false;

    return true;
  });

  // Map to our YieldPool type, filtering out pools with no vault address
  return filtered
    .map((p) => {
      const chainId = DEFI_LLAMA_CHAIN_MAP[p.chain];
      const poolAddress = resolvePoolAddress(p, chainId);
      return {
        id: p.pool,
        protocol: PROTOCOL_KEY_MAP[p.project] ?? ("morpho" as const),
        protocolLabel: PROTOCOL_LABEL_MAP[p.project] ?? p.project,
        vaultName: formatVaultName(p.symbol, p.project, asset),
        chain: p.chain,
        chainId,
        symbol: p.symbol,
        asset,
        apy: roundTo(p.apy, 2),
        apyBase: roundTo(p.apyBase ?? 0, 2),
        apyReward: roundTo(p.apyReward ?? 0, 2),
        tvlUsd: p.tvlUsd,
        poolAddress,
        poolMeta: p.poolMeta,
        poolId: p.pool,
        predictions: p.predictions ?? null,
        isBest: false,
      };
    })
    .filter((p) => p.poolAddress !== ZERO_ADDRESS);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
