import type { Address } from "viem";

// ---------------------------------------------------------------------------
// Chain definitions
// ---------------------------------------------------------------------------

export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  explorer: string;
  aaveV3Pool: Address;
  tokens: Record<string, TokenConfig>;
  morphoVaults: MorphoVaultConfig[];
}

export interface TokenConfig {
  symbol: string;
  address: Address;
  decimals: number;
}

export interface MorphoVaultConfig {
  name: string;
  vaultAddress: Address;
  asset: string; // "USDC" | "USDT"
  poolId?: string; // DeFi Llama pool UUID for exact matching
}

// ---------------------------------------------------------------------------
// Aave V3 Pool ABI (supply function only)
// ---------------------------------------------------------------------------

export const AAVE_V3_POOL_ABI = [
  {
    name: "supply",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
] as const;

// ---------------------------------------------------------------------------
// ERC-20 Approve ABI (for token approvals)
// ---------------------------------------------------------------------------

export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Morpho MetaMorpho Vault ABI (ERC-4626 deposit)
// ---------------------------------------------------------------------------

export const MORPHO_VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Supported chains with Aave V3 pool addresses & token configs
// ---------------------------------------------------------------------------

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    explorer: "https://etherscan.io",
    aaveV3Pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
      },
      USDT: {
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
      },
    },
    morphoVaults: [
      {
        name: "ReEcosystem Vault",
        vaultAddress: "0xD1E9242e075Db4bdd3f3c721D7d5fd4180A94A7e",
        asset: "USDC",
        poolId: "ab979dd7-f3bd-4dc7-a95d-cabdea1bf059",
      },
      {
        name: "Gauntlet USDT Frontier",
        vaultAddress: "0x79FD640000F8563A866322483524a4b48f1Ed702",
        asset: "USDT",
        poolId: "0f25159f-753d-4eef-84f5-1f9b47394033",
      },
      {
        name: "AlphaPing PT Frontier",
        vaultAddress: "0x6701957aaA39e9352a42729Cc65436a4C945cB90",
        asset: "USDC",
        poolId: "90468580-8c04-4cba-93ef-c686f06d91a3",
      },
     {
        name: "ReEcosystem Ultra Vault",
        vaultAddress: "0xD1E9242e075Db4bdd3f3c721D7d5fd4180A94A7e",
        asset: "USDC",
        poolId: "935fb02d-9645-4d46-85e0-5504bd01ef80",
      },
      {
        name: "Steakhouse Reservoir USDC",
        vaultAddress: "0xbeEF346d7099865208Ff331e4f648f4154DDAa05",
        asset: "USDC",
        poolId: "9d1a102c-92e7-4536-bdea-b6cc693af428",
      },
    ],
  },

  8453: {
    id: 8453,
    name: "Base",
    shortName: "BASE",
    logo: "https://assets.coingecko.com/coins/images/32594/small/base.png",
    explorer: "https://basescan.org",
    aaveV3Pool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
    },
    morphoVaults: [
      {
        name: "Edge Ultra Yeild USDC",
        vaultAddress: "0x5435BC53f2C61298167cdB11Cdf0Db2BFa259ca0",
        asset: "USDC",
        poolId: "c29704a4-3537-459d-bc4d-1f8812f28bcd",
      },
      {
        name: "Clearstar USDC Reactor",
        vaultAddress: "0x1D3b1Cd0a0f242d598834b3F2d126dC6bd774657",
        asset: "USDC",
        poolId: "34b65551-cca1-48f4-9a62-2145c24e92a4",
      },
      {
        name: "Steakhouse High Yield USDC",
        vaultAddress: "0xCBeeF01994E24a60f7DCB8De98e75AD8BD4Ad60d",
        asset: "USDC",
      },
      {
        name: "Steakhouse USDC RWA",
        vaultAddress: "0xbEefc4aDBE58173FCa2C042097Fe33095E68C3D6",
        asset: "USDC",
      },
      {
        name: "Steakhouse Prime USDC",
        vaultAddress: "0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2",
        asset: "USDC",
      },
      {
        name: "Gauntlet USDC Prime",
        vaultAddress: "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61",
        asset: "USDC",
      },
      {
        name: "Gauntlet USDC Core",
        vaultAddress: "0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12",
        asset: "USDC",
      },
    ],
  },

  42161: {
    id: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    logo: "https://assets.coingecko.com/coins/images/16547/small/arbitrum.png",
    explorer: "https://arbiscan.io",
    aaveV3Pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6,
      },
      USDT: {
        symbol: "USDT",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        decimals: 6,
      },
    },
    morphoVaults: [
      {
        name: "Hyperithm USDC",
        vaultAddress: "0x4B6F1C9E5d470b97181786b26da0d0945A7cf027",
        asset: "USDC",
        poolId: "646df9da-01ef-4da5-9746-acbf12f70cfa",
      },
      {
        name: "Glanto USDC",
        vaultAddress: "0x55a2B207b0074E13AdCb858950a81B7a04775E0F",
        asset: "USDC",
        poolId: "8b0a8a57-e1b0-4d69-ab5d-d858de1d4170",
      },
    ],
  },

  10: {
    id: 10,
    name: "Optimism",
    shortName: "OP",
    logo: "https://assets.coingecko.com/coins/images/25244/small/optimism.png",
    explorer: "https://optimistic.etherscan.io",
    aaveV3Pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        decimals: 6,
      },
      USDT: {
        symbol: "USDT",
        address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        decimals: 6,
      },
    },
    morphoVaults: [],
  },

  137: {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
    explorer: "https://polygonscan.com",
    aaveV3Pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        decimals: 6,
      },
      USDT: {
        symbol: "USDT",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
      },
    },
    morphoVaults: [],
  },

  56: {
    id: 56,
    name: "BNB Chain",
    shortName: "BNB",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    explorer: "https://bscscan.com",
    aaveV3Pool: "0x6807dc923806fE8Fd134338EABCA509979a7e0cB",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        decimals: 18,
      },
      USDT: {
        symbol: "USDT",
        address: "0x55d398326f99059fF775485246999027B3197955",
        decimals: 18,
      },
    },
    morphoVaults: [],
  },
};

// ---------------------------------------------------------------------------
// DeFi Llama chain name → our chain ID mapping
// ---------------------------------------------------------------------------

export const DEFI_LLAMA_CHAIN_MAP: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Optimism: 10,
  Polygon: 137,
  BSC: 56,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const SUPPORTED_CHAIN_IDS = Object.keys(SUPPORTED_CHAINS).map(Number);

export const SUPPORTED_ASSETS = ["USDC", "USDT"] as const;
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

export const LIFI_INTEGRATOR = "safe-wallet-pay";

export function getTokenConfig(
  chainId: number,
  asset: string,
): TokenConfig | undefined {
  return SUPPORTED_CHAINS[chainId]?.tokens[asset];
}

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

export function getAllChainConfigs(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS);
}
