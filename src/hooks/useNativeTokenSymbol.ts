import { useChainId, useConfig } from "wagmi";

const CHAIN_SYMBOLS: { [key: number]: string } = {
  1: "ETH", // Ethereum Mainnet
  11155111: "ETH", // Sepolia
  5: "ETH", // Goerli
  296: "HBAR", // Hedera Testnet
  297: "HBAR", // Hedera Mainnet
  5003: "MNT", // Mantle Sepolia
};

export function useNativeTokenSymbol() {
  const chainId = useChainId();
  const config = useConfig();

  // Default to ETH if no chain is selected
  if (!chainId) return "ETH";

  // Get from predefined symbols
  if (CHAIN_SYMBOLS[chainId]) {
    return CHAIN_SYMBOLS[chainId];
  }

  // Fallback to chain config
  const chain = config.chains.find((c) => c.id === chainId);
  return chain?.nativeCurrency?.symbol || "ETH";
}
