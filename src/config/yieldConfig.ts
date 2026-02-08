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
        name: "Steakhouse USDC",
        vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        asset: "USDC",
      },
      {
        name: "Steakhouse USDT",
        vaultAddress: "0xbEef047a543E45807105E51A8BBEFCc5950fcfBa",
        asset: "USDT",
      },
      {
        name: "Gauntlet USDC Prime",
        vaultAddress: "0xdd0f28e19C1780eb6396170735D45153D261490d",
        asset: "USDC",
      },
      {
        name: "Gauntlet USDC Core",
        vaultAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458",
        asset: "USDC",
      },
      {
        name: "Gauntlet USDC Flagship",
        vaultAddress: "0xc582F04d8a82795aa2Ff9c8bb4c1c889fe7b754e",
        asset: "USDC",
      },
      {
        name: "Smokehouse USDC",
        vaultAddress: "0xBEeFFF209270748ddd194831b3fa287a5386f5bC",
        asset: "USDC",
      },
      {
        name: "Gauntlet USDC RWA",
        vaultAddress: "0xA8875aaeBc4f830524e35d57F9772FfAcbdD6C45",
        asset: "USDC",
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
        name: "Moonwell Flagship USDC",
        vaultAddress: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca",
        asset: "USDC",
      },
      {
        name: "Steakhouse USDC",
        vaultAddress: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
        asset: "USDC",
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
        name: "Steakhouse High Yield USDC",
        vaultAddress: "0x5c0C306Aaa9F877de636f4d5822cA9F2E81563BA",
        asset: "USDC",
      },
      {
        name: "Steakhouse Prime USDC",
        vaultAddress: "0x250CF7c82bAc7cB6cf899b6052979d4B5BA1f9ca",
        asset: "USDC",
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
