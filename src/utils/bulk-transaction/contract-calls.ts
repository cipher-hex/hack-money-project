import {
  writeContract,
  readContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { parseEther, parseUnits, formatUnits } from "viem";
import tokenInfo from "../contract-address/safePay-tokens.json";
import BulkTransactionManagerABI from "../../artifacts/BulkTransactionManager.json";
import bulkTransactionAddresses from "../contract-address/bulk-transaction-addresses.json";
import {
  Recipient,
  BulkTransaction,
  RecipientFormData,
} from "../../types/bulk-transaction";

// Get contract address based on chainId
export const getBulkTransactionContractAddress = (
  chainId: number
): `0x${string}` => {
  const deployment = bulkTransactionAddresses.find(
    (d) => d.chainId === chainId.toString()
  );

  if (!deployment || !deployment.contractAddress) {
    throw new Error(`No BulkTransactionManager deployed on chain ${chainId}`);
  }

  return deployment.contractAddress as `0x${string}`;
};

// Wagmi config will be passed from components
let wagmiConfig: any = null;

export const setBulkTransactionWagmiConfig = (config: any) => {
  wagmiConfig = config;
};

// Recipient Management Functions
export const addRecipient = async (
  recipientData: RecipientFormData,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "addRecipient",
      args: [
        recipientData.walletAddress,
        recipientData.relation,
        recipientData.fullName,
        recipientData.userId || "",
      ],
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    console.error("Add recipient error:", error);
    throw error;
  }
};

export const updateRecipient = async (
  recipientId: number,
  recipientData: RecipientFormData,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "updateRecipient",
      args: [
        BigInt(recipientId),
        recipientData.walletAddress,
        recipientData.relation,
        recipientData.fullName,
        recipientData.userId || "",
      ],
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    console.error("Update recipient error:", error);
    throw error;
  }
};

export const deleteRecipient = async (
  recipientId: number,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "deleteRecipient",
      args: [BigInt(recipientId)],
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    console.error("Delete recipient error:", error);
    throw error;
  }
};

// Bulk Transfer Functions
export const bulkTransferNative = async (
  recipientIds: number[],
  amounts: string[],
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  // Determine chain decimals from configuration
  const chainConfig = tokenInfo.find((c) => c.chainId === chainId.toString());
  const chainDecimals = chainConfig?.nativeCurrency?.decimals || 18;

  // Calculate amounts using the chain's native decimals for the contract arguments.
  // For Hedera, this will be 8 decimals (Tinybars).
  // For Sepolia, this will be 18 decimals (Wei).
  const amountsForContract = amounts.map((amount) =>
    parseUnits(amount, chainDecimals)
  );

  // Calculate the total transaction value.
  // IMPORTANT: For EVM compatibility on Hedera, the 'value' field in a transaction
  // is typically expected to be in 18-decimal "Wei-bars" by wallets like Metamask,
  // even if the underlying chain uses 8 decimals.
  // However, if we simply sum up the amountsForContract, we get the correct native value (e.g. in Tinybars).
  // If we pass this native value as 'value' to Wagmi/Metamask on Hedera, Metamask might interpret it as Wei
  // (10^-10 HBAR), resulting in a tiny transfer.
  // To ensure the wallet displays and sends the correct amount of HBAR (e.g. 0.7), we must provide
  // the value in 18 decimals (parseEther) if the chain ID implies standard EVM behavior.
  // BUT, the contract receives the value in its native denomination (Tinybars on Hedera).
  // So:
  // 1. Value sent to network: Must be correctly interpreted by wallet -> parseEther (18 decimals).
  //    The JSON-RPC relay converts 18-decimal Wei-bar input to 8-decimal Tinybar output for the network.
  // 2. Arguments passed to contract: Must match what the contract sees in msg.value (Tinybars).
  //    So arguments must be 8 decimals.

  // Always use 18 decimals for the transaction 'value' field to satisfy Metamask/Wagmi defaults.
  const amountsForValue = amounts.map((amount) => parseEther(amount));
  const totalValueWei = amountsForValue.reduce(
    (acc, curr) => acc + curr,
    BigInt(0)
  );

  try {
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "bulkTransferNative",
      args: [recipientIds.map((id) => BigInt(id)), amountsForContract],
      value: totalValueWei,
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    console.error("Bulk transfer native error:", error);
    throw error;
  }
};

export const bulkTransferERC20 = async (
  tokenAddress: string,
  recipientIds: number[],
  amounts: string[],
  decimals: number,
  chainId: number
): Promise<string> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  // Convert amounts to token units
  const amountsInTokenUnits = amounts.map((amount) =>
    parseUnits(amount, decimals)
  );

  try {
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "bulkTransferERC20",
      args: [
        tokenAddress,
        recipientIds.map((id) => BigInt(id)),
        amountsInTokenUnits,
      ],
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    console.error("Bulk transfer ERC20 error:", error);
    throw error;
  }
};

// View Functions
export const getRecipients = async (
  userAddress: string,
  chainId: number
): Promise<Recipient[]> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const result = (await readContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "getAllRecipientsWithIds",
      args: [userAddress],
    })) as any;

    const recipients: Recipient[] = [];
    if (result && result[0] && result[1]) {
      for (let i = 0; i < result[0].length; i++) {
        recipients.push({
          id: Number(result[1][i]),
          walletAddress: result[0][i].walletAddress,
          relation: result[0][i].relation,
          fullName: result[0][i].fullName,
          userId: result[0][i].userId,
          isActive: result[0][i].isActive,
          createdAt: Number(result[0][i].createdAt),
          updatedAt: Number(result[0][i].updatedAt),
        });
      }
    }

    return recipients;
  } catch (error) {
    console.error("Get recipients error:", error);
    return [];
  }
};

export const getTransactionHistory = async (
  userAddress: string,
  chainId: number
): Promise<BulkTransaction[]> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const result = (await readContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "getTransactionHistory",
      args: [userAddress],
    })) as any[];

    // Pick correct decimals from safePay-tokens.json for this chain/token
    const chainConfig = tokenInfo.find((c) => c.chainId === chainId.toString());

    return result.map((tx) => {
      let decimals = 18;
      if (chainConfig) {
        if (tx.isNative) {
          decimals = chainConfig.nativeCurrency?.decimals ?? 18;
        } else if (
          tx.tokenAddress &&
          tx.tokenAddress !== "0x0000000000000000000000000000000000000000"
        ) {
          const token = chainConfig.supportedTokens?.find(
            (t) =>
              t.address.toLowerCase() === String(tx.tokenAddress).toLowerCase()
          );
          decimals = token?.decimals ?? 18;
        }
      }

      return {
        sender: tx.sender,
        tokenAddress: tx.tokenAddress,
        totalAmount: formatUnits(tx.totalAmount, decimals),
        recipientCount: Number(tx.recipientCount),
        timestamp: Number(tx.timestamp),
        isNative: tx.isNative,
      } as BulkTransaction;
    });
  } catch (error) {
    console.error("Get transaction history error:", error);
    return [];
  }
};

export const getRecipientCount = async (
  userAddress: string,
  chainId: number
): Promise<number> => {
  if (!wagmiConfig) throw new Error("Wagmi config not set");

  const contractAddress = getBulkTransactionContractAddress(chainId);

  try {
    const result = (await readContract(wagmiConfig, {
      address: contractAddress,
      abi: BulkTransactionManagerABI.abi,
      functionName: "getRecipientCount",
      args: [userAddress],
    })) as bigint;

    return Number(result);
  } catch (error) {
    console.error("Get recipient count error:", error);
    return 0;
  }
};
