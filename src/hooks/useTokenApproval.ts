import { useState, useCallback } from "react";
import {
  useWriteContract,
  useReadContract,
  useChainId,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import contractAddresses from "../utils/contract-address/safePay-address.json";

// ERC-20 ABI for approval functions
const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

interface UseTokenApprovalParams {
  tokenAddress?: string;
  userAddress?: string;
  decimals: number;
  spenderAddress?: string; // Allow custom spender address
}

export function useTokenApproval({
  tokenAddress,
  userAddress,
  decimals,
  spenderAddress,
}: UseTokenApprovalParams) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [isApproving, setIsApproving] = useState(false);

  // Get contract address (custom spender or SafePay contract address)
  const getContractAddress = (): string | undefined => {
    if (spenderAddress) return spenderAddress;
    const deployment = contractAddresses.find(
      (d) => d.chainId === chainId.toString()
    );
    return deployment?.safePayAddress;
  };

  // Check if chain is supported
  const isChainSupported = !!getContractAddress();

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress, getContractAddress()],
    query: {
      enabled:
        !!tokenAddress &&
        !!userAddress &&
        !!getContractAddress() &&
        tokenAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Write contract for approval
  const { writeContractAsync } = useWriteContract();

  // Check if approval is needed
  const needsApproval = useCallback(
    (amount: string): boolean => {
      if (!allowance) return true;

      try {
        const requiredAmount = parseUnits(amount, decimals);
        return (allowance as bigint) < requiredAmount;
      } catch (error) {
        console.error("Error checking approval:", error);
        return true;
      }
    },
    [allowance, decimals]
  );

  // Get current allowance in human readable format
  const getCurrentAllowance = useCallback((): string => {
    if (!allowance) return "0";
    return formatUnits(allowance as bigint, decimals);
  }, [allowance, decimals]);

  // Approve specific amount
  const approveAmount = useCallback(
    async (amount: string): Promise<void> => {
      if (!tokenAddress || !userAddress) {
        throw new Error("Token address and user address are required");
      }

      setIsApproving(true);
      try {
        const amountToApprove = parseUnits(amount, decimals);

        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [getContractAddress(), amountToApprove],
        });

        // Wait for transaction to be confirmed
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        // Refetch allowance after approval
        await refetchAllowance();
      } catch (error) {
        console.error("Approval failed:", error);
        throw error;
      } finally {
        setIsApproving(false);
      }
    },
    [
      tokenAddress,
      userAddress,
      decimals,
      writeContractAsync,
      refetchAllowance,
      publicClient,
    ]
  );

  // Approve maximum amount (infinite approval)
  const approveMax = useCallback(async (): Promise<void> => {
    if (!tokenAddress || !userAddress) {
      throw new Error("Token address and user address are required");
    }

    setIsApproving(true);
    try {
      const hash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [getContractAddress(), maxUint256],
      });

      // Wait for transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Refetch allowance after approval
      await refetchAllowance();
    } catch (error) {
      console.error("Max approval failed:", error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [
    tokenAddress,
    userAddress,
    writeContractAsync,
    refetchAllowance,
    publicClient,
  ]);

  // Reset approval (set to 0)
  const resetApproval = useCallback(async (): Promise<void> => {
    if (!tokenAddress || !userAddress) {
      throw new Error("Token address and user address are required");
    }

    setIsApproving(true);
    try {
      const hash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [getContractAddress(), 0n],
      });

      // Wait for transaction to be confirmed
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Refetch allowance after reset
      await refetchAllowance();
    } catch (error) {
      console.error("Reset approval failed:", error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [
    tokenAddress,
    userAddress,
    writeContractAsync,
    refetchAllowance,
    publicClient,
  ]);

  return {
    allowance: allowance as bigint | undefined,
    needsApproval,
    getCurrentAllowance,
    approveAmount,
    approveMax,
    resetApproval,
    isApproving,
    refetchAllowance,
    isChainSupported,
  };
}
