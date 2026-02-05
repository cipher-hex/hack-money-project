import {
  writeContract,
  readContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import {
  parseEther,
  formatEther,
  decodeEventLog,
  parseUnits as parseViemUnits,
  formatUnits,
} from "viem";
import contractAddresses from "../utils/contract-address/safePay-address.json";
import tokenInfo from "./contract-address/safePay-tokens.json";
import SafePayABI from "../artifacts/SafePay.json";

// We'll need to pass config from components
let wagmiConfig: any = null;

export const setWagmiConfig = (config: any) => {
  wagmiConfig = config;
};

// Function to get contract address based on chainId
const getContractAddress = (chainId: number): `0x${string}` => {
  const deployment = contractAddresses.find(
    (d) => d.chainId === chainId.toString()
  );
  if (!deployment) {
    throw new Error(`No contract address found for chain ID: ${chainId}`);
  }
  return deployment.safePayAddress as `0x${string}`;
};

const getNativeCurrencyDecimals = (chainId: number): number => {
  const networkInfo = tokenInfo.find((n) => n.chainId === chainId.toString());
  return networkInfo?.nativeCurrency.decimals || 18; // Default to 18 if not found
};

// Use ABI from SafePay.json artifact
const SafePayContractABI = SafePayABI.abi;

// Types for all events and returns
interface TransactionEvent {
  type: "TransactionInitiated" | "TransactionClaimed" | "TransactionRefunded";
  transactionId: string;
  sender_address?: string;
  recipient_address?: string;
  amount: string;
  note?: string;
  event?: any;
}

interface UserProfile {
  userId: string;
  transactionIds: string[];
}

// Contract configuration
// Helper to get the current contract config
const getContractConfig = () => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const chainId = wagmiConfig.state.chainId;
  return {
    address: getContractAddress(chainId),
    abi: SafePayContractABI,
  };
};

// User Registration and Management
export const registerUserId = async (userId: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const hash = await writeContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "registerUserId",
    args: [userId],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
};

export const getUserByUserId = async (userId: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  return await readContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "getUserByUserId",
    args: [userId],
  });
};

export const getUserByAddress = async (address: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  return await readContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "getUserByAddress",
    args: [address as `0x${string}`],
  });
};

export const getUserProfile = async (
  userAddress: string
): Promise<UserProfile> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  try {
    console.log("🔍 Getting user profile for address:", userAddress);

    const result = (await readContract(wagmiConfig, {
      ...getContractConfig(),
      functionName: "getUserProfile",
      args: [userAddress as `0x${string}`],
    })) as any;

    console.log("📋 Raw user profile result:", result);
    console.log(
      "🔍 Is array:",
      Array.isArray(result),
      "Length:",
      result?.length
    );

    // The contract returns an array: [userId, transactionIds]
    if (!result || !Array.isArray(result) || result.length < 2) {
      console.log("❌ Invalid user profile format, returning empty profile");
      return {
        userId: "",
        transactionIds: [],
      };
    }

    const [userId, transactionIds] = result;

    console.log(
      "📊 Parsed user profile - userId:",
      userId,
      "transactionIds:",
      transactionIds
    );

    return {
      userId: userId || "",
      transactionIds: transactionIds || [],
    };
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    // Return empty profile if user doesn't exist
    return {
      userId: "",
      transactionIds: [],
    };
  }
};

// Basic Transaction Functions
export const sendToWalletAddress = async (
  recipient_address: string,
  amount: string,
  note: string
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const hash = await writeContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "sendToWalletAddress",
    args: [recipient_address as `0x${string}`, note],
    value: parseUnits(
      amount,
      getNativeCurrencyDecimals(wagmiConfig.state.chainId)
    ),
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

  // Find the TransactionInitiated event to get the transactionId
  for (const log of receipt.logs) {
    try {
      const decodedLog = decodeEventLog({
        abi: SafePayContractABI,
        data: log.data,
        topics: log.topics,
      });
      if (decodedLog.eventName === "TransactionInitiated" && decodedLog.args) {
        return (decodedLog.args as any).transactionId as string;
      }
    } catch (e) {
      // Skip logs that can't be decoded
      continue;
    }
  }

  throw new Error("Transaction ID not found in transaction receipt");
};

export const sendToUserId = async (
  userId: string,
  amount: string,
  note: string
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const hash = await writeContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "sendToUserId",
    args: [userId, note],
    value: parseUnits(
      amount,
      getNativeCurrencyDecimals(wagmiConfig.state.chainId)
    ),
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

  // Find the TransactionInitiated event to get the transactionId
  for (const log of receipt.logs) {
    try {
      const decodedLog = decodeEventLog({
        abi: SafePayContractABI,
        data: log.data,
        topics: log.topics,
      });
      if (decodedLog.eventName === "TransactionInitiated" && decodedLog.args) {
        return (decodedLog.args as any).transactionId as string;
      }
    } catch (e) {
      // Skip logs that can't be decoded
      continue;
    }
  }

  throw new Error("Transaction ID not found in transaction receipt");
};

export const claimTransactionById = async (transactionId: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const hash = await writeContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "claimTransactionById",
    args: [transactionId], // bytes32 value, no casting needed
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
};

export const refundTransaction = async (transactionId: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const hash = await writeContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "refundTransaction",
    args: [transactionId], // bytes32 value, no casting needed
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
};

// Transaction History Functions
interface RawContractTransaction {
  sender_address: string;
  recipient_address: string;
  amount: bigint;
  timestamp: bigint;
  status: number;
  note: string;
}

export const getUserTransactions = async (
  userAddress: string
): Promise<Transaction[]> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");
  const transactions = (await readContract(wagmiConfig, {
    ...getContractConfig(),
    functionName: "getUserTransactions",
    args: [userAddress as `0x${string}`],
  })) as RawContractTransaction[];

  const chainId = wagmiConfig.state.chainId;
  const nativeDecimals = getNativeCurrencyDecimals(chainId);

  return transactions.map((transaction: any) => ({
    sender_address: transaction.sender_address,
    recipient_address: transaction.recipient_address,
    amount: transaction.isNative
      ? formatUnits(transaction.amount, nativeDecimals)
      : formatUnits(transaction.amount, 18), // Assuming 18 for now, will need to be dynamic
    timestamp: Number(transaction.timestamp),
    status: transaction.status,
    note: transaction.note,
  }));
};

export const getTransactionDetails = async (transactionId: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  try {
    console.log("Getting transaction details for ID:", transactionId);

    // Ensure transaction ID is in proper format
    let formattedTransactionId = transactionId;

    if (transactionId.startsWith("0x") && transactionId.length !== 66) {
      throw new Error("Invalid transaction ID format");
    }

    const result = (await readContract(wagmiConfig, {
      ...getContractConfig(),
      functionName: "getTransactionDetails",
      args: [formattedTransactionId],
    })) as any;

    console.log("Raw transaction data (enhanced):", result);
    console.log("Is array:", Array.isArray(result), "Length:", result?.length);

    // The enhanced contract returns 9 values now:
    // [transactionId, sender_address, recipient_address, amount, timestamp, status, note, tokenAddress, isNative]
    if (!result || !Array.isArray(result) || result.length < 9) {
      throw new Error("Transaction not found or using old contract");
    }

    const [
      returnedTransactionId,
      sender_address,
      recipient_address,
      amount,
      timestamp,
      status,
      note,
      tokenAddress,
      isNative,
    ] = result;

    // Check if transaction exists (sender_address should not be zero address)
    if (
      !sender_address ||
      sender_address === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Transaction not found");
    }

    // Format amount based on token type
    let formattedAmount = "0";
    if (amount && amount > 0n) {
      if (isNative) {
        const chainId = wagmiConfig.state.chainId;
        const nativeDecimals = getNativeCurrencyDecimals(chainId);
        formattedAmount = formatUnits(amount, nativeDecimals);
      } else {
        // ERC-20 token - need to determine decimals
        // For PYUSD, it's 6 decimals
        const tokenAddr = tokenAddress.toLowerCase();
        let decimals = 18; // default

        // Known token decimals - hardcoded for now
        if (tokenAddr === "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9") {
          // PYUSD Sepolia
          decimals = 6;
        } else if (tokenAddr === "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238") {
          // USDC Sepolia
          decimals = 6;
        } else if (tokenAddr === "0x08210f9170f89ab7658f0b5e3ff39b0e03c594d4") {
          // EURC Sepolia
          decimals = 6;
        } else if (tokenAddr === "0x0000000000000000000000000000000000068cda") {
          // HUSD Hedera Testnet
          decimals = 6;
        }

        // Format with correct decimals
        const divisor = BigInt(10 ** decimals);
        const wholePart = amount / divisor;
        const fractionalPart = amount % divisor;

        if (fractionalPart === 0n) {
          formattedAmount = wholePart.toString();
        } else {
          const fractionalStr = fractionalPart
            .toString()
            .padStart(decimals, "0");
          const trimmedFractional = fractionalStr.replace(/0+$/, "");
          formattedAmount = wholePart.toString() + "." + trimmedFractional;
        }
      }
    }

    console.log("✅ Formatted transaction details:", {
      transactionId: returnedTransactionId || transactionId,
      sender_address,
      recipient_address,
      amount: formattedAmount,
      timestamp: Number(timestamp),
      status: Number(status),
      note,
      tokenAddress,
      isNative,
    });

    return {
      transactionId: returnedTransactionId || transactionId,
      sender_address: sender_address || "",
      recipient_address: recipient_address || "",
      amount: formattedAmount,
      timestamp: timestamp ? Number(timestamp) : 0,
      status: status !== undefined ? Number(status) : -1,
      note: note || "",
      tokenAddress:
        tokenAddress || "0x0000000000000000000000000000000000000000",
      isNative: Boolean(isNative),
    };
  } catch (error) {
    console.error(
      "Error getting transaction details for ID:",
      transactionId,
      "Error:",
      error
    );
    throw new Error("Transaction not found");
  }
};

export const getPendingTransactions = async (sender_address: string) => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  try {
    const result = await readContract(wagmiConfig, {
      ...getContractConfig(),
      functionName: "getPendingTransactions",
      args: [sender_address as `0x${string}`],
    });

    console.log("Raw pending transactions result:", result);
    console.log(
      "Type of result:",
      typeof result,
      "Is array:",
      Array.isArray(result)
    );

    // Ensure we always return an array
    const transactions = result || [];
    console.log("Pending transaction IDs:", transactions);

    return transactions;
  } catch (error) {
    console.error("Error getting pending transactions:", error);
    return [];
  }
};

// Event Listeners - Note: For wagmi, event listening is typically handled by hooks like useWatchContractEvent
// This function is kept for compatibility but consider using wagmi's event hooks in components
export const listenForAllEvents = (
  callback: (event: TransactionEvent) => void
) => {
  // With wagmi, event listening is typically handled in components using useWatchContractEvent
  // This is a placeholder - implement using wagmi's event watching hooks in components
  console.log(
    "Event listening should be implemented using wagmi hooks in components"
  );

  return () => {
    console.log("Event listeners cleanup");
  };
};

// Helper Functions
export const formatAmount = (amount: bigint): string => {
  return formatEther(amount);
};

export const parseAmount = (amount: string): bigint => {
  return parseEther(amount);
};

export const formatTimestamp = (timestamp: bigint): Date => {
  return new Date(Number(timestamp) * 1000);
};

export interface Transaction {
  transactionId?: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  timestamp: number;
  status: number;
  note: string;
  tokenAddress?: string;
  isNative?: boolean;
}

// ====================================
// ERC-20 TOKEN FUNCTIONS
// ====================================

export const sendERC20ToWalletAddress = async (
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  note: string,
  decimals: number,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) {
    throw new Error("Wagmi config not initialized");
  }

  const contractAddress = getContractAddress(chainId);
  const parsedAmount = parseUnits(amount, decimals);

  const hash = await writeContract(wagmiConfig, {
    address: contractAddress,
    abi: SafePayContractABI,
    functionName: "sendERC20ToWalletAddress",
    args: [tokenAddress, recipientAddress, parsedAmount, note],
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
  });

  // Extract the transaction ID from the TransactionInitiated event
  console.log("Transaction receipt:", receipt);
  console.log("Transaction logs:", receipt.logs);

  // Find the TransactionInitiated event in the logs
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: SafePayContractABI,
        data: log.data,
        topics: log.topics,
      });

      console.log("Decoded event:", decoded);

      if (decoded.eventName === "TransactionInitiated") {
        const transactionId = (decoded.args as any)?.transactionId as string;
        if (transactionId) {
          console.log("✅ Found transaction ID from event:", transactionId);
          return transactionId;
        }
      }
    } catch (error) {
      // Continue if this log can't be decoded with our ABI
      continue;
    }
  }

  // Fallback to transaction hash if event not found
  console.warn(
    "⚠️ Could not find TransactionInitiated event, returning transaction hash"
  );
  return hash;
};

export const sendERC20ToUserId = async (
  tokenAddress: string,
  userId: string,
  amount: string,
  note: string,
  decimals: number,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) {
    throw new Error("Wagmi config not initialized");
  }

  const contractAddress = getContractAddress(chainId);
  const parsedAmount = parseUnits(amount, decimals);

  const hash = await writeContract(wagmiConfig, {
    address: contractAddress,
    abi: SafePayContractABI,
    functionName: "sendERC20ToUserId",
    args: [tokenAddress, userId, parsedAmount, note],
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
  });

  // Extract the transaction ID from the TransactionInitiated event
  console.log("Transaction receipt (userId):", receipt);
  console.log("Transaction logs (userId):", receipt.logs);

  // Find the TransactionInitiated event in the logs
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: SafePayContractABI,
        data: log.data,
        topics: log.topics,
      });

      console.log("Decoded event (userId):", decoded);

      if (decoded.eventName === "TransactionInitiated") {
        const transactionId = (decoded.args as any)?.transactionId as string;
        if (transactionId) {
          console.log(
            "✅ Found transaction ID from event (userId):",
            transactionId
          );
          return transactionId;
        }
      }
    } catch (error) {
      // Continue if this log can't be decoded with our ABI
      continue;
    }
  }

  // Fallback to transaction hash if event not found
  console.warn(
    "⚠️ Could not find TransactionInitiated event (userId), returning transaction hash"
  );
  return hash;
};

export const claimERC20Transaction = async (
  transactionId: string,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) {
    throw new Error("Wagmi config not initialized");
  }

  const contractAddress = getContractAddress(chainId);

  const result = await writeContract(wagmiConfig, {
    address: contractAddress,
    abi: SafePayContractABI,
    functionName: "claimERC20Transaction",
    args: [transactionId],
  });

  await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });

  return result;
};

export const refundERC20Transaction = async (
  transactionId: string,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) {
    throw new Error("Wagmi config not initialized");
  }

  const contractAddress = getContractAddress(chainId);

  const result = await writeContract(wagmiConfig, {
    address: contractAddress,
    abi: SafePayContractABI,
    functionName: "refundERC20Transaction",
    args: [transactionId],
  });

  await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });

  return result;
};

// Helper function for parsing units with different decimals
const parseUnits = (value: string, decimals: number): bigint => {
  const factor = BigInt(10 ** decimals);
  const parts = value.split(".");
  const whole = BigInt(parts[0] || 0);
  const fraction = parts[1] || "";

  if (fraction.length === 0) {
    return whole * factor;
  }

  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const fractionBigInt = BigInt(paddedFraction);

  return whole * factor + fractionBigInt;
};
