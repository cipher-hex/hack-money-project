import { useMemo } from "react";
import { TokenSelection } from "./useTokenConfig";

export type TransactionType = "native" | "erc20";

export interface TransactionTypeInfo {
  type: TransactionType;
  requiresApproval: boolean;
  functionName: string;
  claimFunctionName: string;
  refundFunctionName: string;
}

export function useTransactionType(selectedToken?: TokenSelection) {
  const transactionInfo = useMemo((): TransactionTypeInfo => {
    if (!selectedToken) {
      // Default to native if no token selected
      return {
        type: "native",
        requiresApproval: false,
        functionName: "sendToWalletAddress", // or sendToUserId
        claimFunctionName: "claimTransactionById",
        refundFunctionName: "refundTransaction",
      };
    }

    if (selectedToken.isNative) {
      return {
        type: "native",
        requiresApproval: false,
        functionName: "sendToWalletAddress", // or sendToUserId
        claimFunctionName: "claimTransactionById",
        refundFunctionName: "refundTransaction",
      };
    } else {
      return {
        type: "erc20",
        requiresApproval: true,
        functionName: "sendERC20ToWalletAddress", // or sendERC20ToUserId
        claimFunctionName: "claimERC20Transaction",
        refundFunctionName: "refundERC20Transaction",
      };
    }
  }, [selectedToken]);

  const isNativeTransaction = transactionInfo.type === "native";
  const isERC20Transaction = transactionInfo.type === "erc20";

  // Helper function to get the correct function based on recipient type
  const getSendFunction = (isUserId: boolean) => {
    if (transactionInfo.type === "native") {
      return isUserId ? "sendToUserId" : "sendToWalletAddress";
    } else {
      return isUserId ? "sendERC20ToUserId" : "sendERC20ToWalletAddress";
    }
  };

  // Helper to determine if transaction requires token address
  const requiresTokenAddress = transactionInfo.type === "erc20";

  // Helper to get token decimals for amount parsing
  const getTokenDecimals = (): number => {
    return selectedToken?.token.decimals || 18;
  };

  // Helper to get token symbol for display
  const getTokenSymbol = (): string => {
    return selectedToken?.token.symbol || "ETH";
  };

  // Helper to get token address (returns zero address for native)
  const getTokenAddress = (): string => {
    return (
      selectedToken?.token.address ||
      "0x0000000000000000000000000000000000000000"
    );
  };

  return {
    transactionInfo,
    isNativeTransaction,
    isERC20Transaction,
    getSendFunction,
    requiresTokenAddress,
    getTokenDecimals,
    getTokenSymbol,
    getTokenAddress,
    selectedToken,
  };
}

// Helper function to detect transaction type from transaction data
export function detectTransactionType(transaction: {
  tokenAddress?: string;
  isNative?: boolean;
}): TransactionType {
  // If isNative is explicitly set, use that
  if (typeof transaction.isNative === "boolean") {
    return transaction.isNative ? "native" : "erc20";
  }

  // If tokenAddress is zero address or not set, it's native
  if (
    !transaction.tokenAddress ||
    transaction.tokenAddress === "0x0000000000000000000000000000000000000000"
  ) {
    return "native";
  }

  // Otherwise it's ERC-20
  return "erc20";
}

// Helper function to determine correct claim/refund function
export function getTransactionFunction(
  transaction: { tokenAddress?: string; isNative?: boolean },
  action: "claim" | "refund"
): string {
  const type = detectTransactionType(transaction);

  if (action === "claim") {
    return type === "native" ? "claimTransactionById" : "claimERC20Transaction";
  } else {
    return type === "native" ? "refundTransaction" : "refundERC20Transaction";
  }
}
