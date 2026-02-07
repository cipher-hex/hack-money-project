import type { Address } from "viem";
import {
  DEFI_LLAMA_CHAIN_MAP,
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
  poolAddress: Address;
  poolMeta: string | null;
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
}

// ---------------------------------------------------------------------------
// DeFi Llama API
// ---------------------------------------------------------------------------

const DEFI_LLAMA_POOLS_URL = "https://yields.llama.fi/pools";

const PROJECT_FILTER = new Set(["aave-v3", "morpho-v1"]);

const PROTOCOL_LABEL_MAP: Record<string, string> = {
  "aave-v3": "Aave V3",
  "morpho-v1": "Morpho",
};

const PROTOCOL_KEY_MAP: Record<string, YieldPool["protocol"]> = {
  "aave-v3": "aave-v3",
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

function resolvePoolAddress(pool: DefiLlamaPool, chainId: number): Address {
  const chainConfig = SUPPORTED_CHAINS[chainId];
  if (!chainConfig) return "0x0000000000000000000000000000000000000000";

  if (pool.project === "aave-v3") {
    return chainConfig.aaveV3Pool;
  }

  // Morpho: try to match a hardcoded vault
  const asset = extractAssetSymbol(pool.symbol);
  const vault = chainConfig.morphoVaults.find((v) => v.asset === asset);
  if (vault) return vault.vaultAddress;

  // Fallback – pool ID sometimes contains the vault address
  return "0x0000000000000000000000000000000000000000";
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
// Public API
// ---------------------------------------------------------------------------

export async function fetchYieldPools(
  asset: SupportedAsset
): Promise<YieldPool[]> {
  const allPools = await fetchAllPools();

  const supportedChainNames = new Set(Object.keys(DEFI_LLAMA_CHAIN_MAP));

  const filtered = allPools.filter((p) => {
    // Must be a supported protocol
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

  // Map to our YieldPool type
  const pools: YieldPool[] = filtered.map((p) => {
    const chainId = DEFI_LLAMA_CHAIN_MAP[p.chain];
    return {
      id: p.pool,
      protocol: PROTOCOL_KEY_MAP[p.project] ?? "aave-v3",
      protocolLabel: PROTOCOL_LABEL_MAP[p.project] ?? p.project,
      chain: p.chain,
      chainId,
      symbol: p.symbol,
      asset,
      apy: roundTo(p.apy, 2),
      apyBase: roundTo(p.apyBase ?? 0, 2),
      apyReward: roundTo(p.apyReward ?? 0, 2),
      tvlUsd: p.tvlUsd,
      poolAddress: resolvePoolAddress(p, chainId),
      poolMeta: p.poolMeta,
      isBest: false,
    };
  });

  // Sort by APY descending
  pools.sort((a, b) => b.apy - a.apy);

  // Mark the best pool
  if (pools.length > 0) {
    pools[0].isBest = true;
  }

  return pools;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
