import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import tokenConfigs from "../utils/contract-address/safePay-tokens.json";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
}

export interface ChainTokenConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
    name: string;
  };
  supportedTokens: TokenInfo[];
}

export interface TokenSelection {
  token: TokenInfo;
  isNative: boolean;
}

export function useTokenConfig() {
  const chainId = useChainId();
  const [currentConfig, setCurrentConfig] = useState<ChainTokenConfig | null>(
    null,
  );
  const [availableTokens, setAvailableTokens] = useState<TokenSelection[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenSelection | null>(
    null,
  );

  useEffect(() => {
    console.log("useTokenConfig - chainId changed to:", chainId);
    if (chainId) {
      // Find configuration for current chain
      const config = tokenConfigs.find((c) => c.chainId === chainId.toString());
      console.log(
        "useTokenConfig - found config:",
        config?.nativeCurrency.symbol,
      );

      if (config) {
        setCurrentConfig(config);

        // Create available tokens list (native + ERC-20 tokens)
        const tokens: TokenSelection[] = [
          // Native currency option
          {
            token: {
              address: "0x0000000000000000000000000000000000000000", // Zero address for native
              symbol: config.nativeCurrency.symbol,
              name: config.nativeCurrency.name,
              decimals: config.nativeCurrency.decimals,
              isNative: true,
            },
            isNative: true,
          },
          // ERC-20 tokens
          ...config.supportedTokens.map((token) => ({
            token: {
              ...token,
              isNative: false,
            },
            isNative: false,
          })),
        ];

        setAvailableTokens(tokens);

        // Default to native currency if no token is selected
        setSelectedToken((prevSelected) => {
          if (!prevSelected) {
            return tokens[0];
          }
          // Try to find the same token in the new chain's tokens
          const sameToken = tokens.find(
            (t) => t.token.symbol === prevSelected.token.symbol,
          );
          return sameToken || tokens[0];
        });
      } else {
        // No configuration found for this chain
        setCurrentConfig(null);
        setAvailableTokens([]);
        setSelectedToken(null);
      }
    }
  }, [chainId]);

  const selectToken = (tokenSelection: TokenSelection) => {
    setSelectedToken(tokenSelection);
  };

  const getTokenByAddress = (address: string): TokenSelection | null => {
    return (
      availableTokens.find(
        (t) => t.token.address.toLowerCase() === address.toLowerCase(),
      ) || null
    );
  };

  const isTokenSupported = (address: string): boolean => {
    return availableTokens.some(
      (t) => t.token.address.toLowerCase() === address.toLowerCase(),
    );
  };

  return {
    currentConfig,
    availableTokens,
    selectedToken,
    selectToken,
    getTokenByAddress,
    isTokenSupported,
    hasTokenSupport: availableTokens.length > 1, // More than just native currency
    chainId,
  };
}
