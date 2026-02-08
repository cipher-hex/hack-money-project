import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useTokenConfig, TokenSelection } from "../../hooks/useTokenConfig";
import { useBalance } from "wagmi";
import { formatTokenAmount } from "../../utils/formatAmount";

interface TokenSelectorProps {
  onTokenSelect: (token: TokenSelection) => void;
  address?: string;
  disabled?: boolean;
}

export default function TokenSelector({
  onTokenSelect,
  address,
  disabled = false,
}: TokenSelectorProps) {
  const { availableTokens, selectedToken, selectToken, hasTokenSupport } =
    useTokenConfig();
  const [isOpen, setIsOpen] = useState(false);

  // Get balance for selected token
  const { data: nativeBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    query: { enabled: !!address && selectedToken?.isNative },
  });

  const { data: tokenBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    token: selectedToken?.isNative
      ? undefined
      : (selectedToken?.token.address as `0x${string}`),
    query: {
      enabled:
        !!address && !selectedToken?.isNative && !!selectedToken?.token.address,
    },
  });

  const handleTokenSelect = (token: TokenSelection) => {
    selectToken(token);
    onTokenSelect(token);
    setIsOpen(false);
  };

  const formatBalance = (balance: string | undefined, symbol: string) => {
    if (!balance) return `0 ${symbol}`;
    return `${formatTokenAmount(balance, { maxDecimals: 4 })} ${symbol}`;
  };

  const getCurrentBalance = () => {
    if (!selectedToken) return "0";

    if (selectedToken.isNative && nativeBalance) {
      return formatBalance(nativeBalance.formatted, selectedToken.token.symbol);
    }

    if (!selectedToken.isNative && tokenBalance) {
      return formatBalance(tokenBalance.formatted, selectedToken.token.symbol);
    }

    return `0 ${selectedToken.token.symbol}`;
  };

  // Don't render if no token support or no selected token
  if (!hasTokenSupport || !selectedToken) {
    return null;
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Token
      </label>

      {/* Selected Token Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-blue-300 hover:bg-gray-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Token Icon Placeholder */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                selectedToken.isNative ? "bg-blue-600" : "bg-emerald-500"
              }`}
            >
              {selectedToken.token.symbol.substring(0, 2)}
            </div>

            <div>
              <div className="font-semibold text-gray-900">
                {selectedToken.token.symbol}
              </div>
              <div className="text-xs text-gray-500">
                {selectedToken.token.name}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {address && (
              <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                {getCurrentBalance()}
              </div>
            )}
            {!disabled &&
              (isOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              ))}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1 max-h-64 overflow-auto">
            {availableTokens.map((tokenOption, index) => (
              <button
                key={`${tokenOption.token.address}-${index}`}
                onClick={() => handleTokenSelect(tokenOption)}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 border-b border-gray-50 last:border-0 ${
                  selectedToken.token.address === tokenOption.token.address
                    ? "bg-blue-50/50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Token Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                        tokenOption.isNative ? "bg-blue-600" : "bg-emerald-500"
                      }`}
                    >
                      {tokenOption.token.symbol.substring(0, 2)}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900 flex items-center">
                        {tokenOption.token.symbol}
                        {tokenOption.isNative && (
                          <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Native
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tokenOption.token.name}
                      </div>
                    </div>
                  </div>

                  {/* Show selected indicator */}
                  {selectedToken.token.address ===
                    tokenOption.token.address && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
