import { createConfig, EVM, getContractCallsQuote } from "@lifi/sdk";
import { encodeFunctionData, type Address, parseUnits } from "viem";
import type { WalletClient } from "viem";
import {
  AAVE_V3_POOL_ABI,
  MORPHO_VAULT_ABI,
  ERC20_APPROVE_ABI,
  LIFI_INTEGRATOR,
  SUPPORTED_CHAINS,
  getTokenConfig,
} from "../config/yieldConfig";
import type { YieldPool } from "./yieldService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposerQuoteParams {
  fromChainId: number;
  fromAsset: string;
  fromAmount: string;
  userAddress: Address;
  targetPool: YieldPool;
}

export interface ComposerQuoteResult {
  quote: any;
  estimatedGas: string;
  estimatedTime: number;
  toolName: string;
  feeCostsUsd: number;
  isSameChain: boolean;
}

export type ExecutionStatus =
  | "idle"
  | "approving"
  | "bridging"
  | "depositing"
  | "completed"
  | "failed";

export interface ExecutionUpdate {
  status: ExecutionStatus;
  txHash?: string;
  message: string;
  substatus?: string;
}

// ---------------------------------------------------------------------------
// LI.FI SDK initialisation
// ---------------------------------------------------------------------------

let _sdkInitialised = false;

export function initLifiSdk(
  getWalletClient: () => Promise<any>,
  switchChainFn: (chainId: number) => Promise<any>,
): void {
  if (_sdkInitialised) return;

  console.log("[MaxYield] Initialising LI.FI SDK…");
  createConfig({
    integrator: LIFI_INTEGRATOR,
    providers: [
      EVM({
        getWalletClient,
        switchChain: async (chainId: number) => {
          console.log(`[MaxYield] LI.FI switchChain → ${chainId}`);
          const chain = await switchChainFn(chainId);
          return chain;
        },
      }),
    ],
  });

  _sdkInitialised = true;
  console.log("[MaxYield] LI.FI SDK initialised.");
}

// ---------------------------------------------------------------------------
// Helper: detect same-chain scenario
// ---------------------------------------------------------------------------

export function isSameChainDeposit(
  fromChainId: number,
  targetPool: YieldPool,
): boolean {
  return fromChainId === targetPool.chainId;
}

// ---------------------------------------------------------------------------
// Build contract call data for different protocols
// ---------------------------------------------------------------------------

function buildAaveV3SupplyCalldata(
  assetAddress: Address,
  amount: bigint,
  onBehalfOf: Address,
): `0x${string}` {
  return encodeFunctionData({
    abi: AAVE_V3_POOL_ABI,
    functionName: "supply",
    args: [assetAddress, amount, onBehalfOf, 0],
  });
}

function buildMorphoDepositCalldata(
  amount: bigint,
  receiver: Address,
): `0x${string}` {
  return encodeFunctionData({
    abi: MORPHO_VAULT_ABI,
    functionName: "deposit",
    args: [amount, receiver],
  });
}

function buildApproveCalldata(spender: Address, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: "approve",
    args: [spender, amount],
  });
}

// ---------------------------------------------------------------------------
// Get a cross-chain contract-call quote via LI.FI Composer
// ---------------------------------------------------------------------------

export async function getComposerQuote(
  params: ComposerQuoteParams,
): Promise<ComposerQuoteResult> {
  const { fromChainId, fromAsset, fromAmount, userAddress, targetPool } =
    params;

  console.log("[MaxYield] getComposerQuote called", {
    fromChainId,
    fromAsset,
    fromAmount,
    targetChainId: targetPool.chainId,
    protocol: targetPool.protocol,
    poolAddress: targetPool.poolAddress,
  });

  // Source token
  const fromToken = getTokenConfig(fromChainId, fromAsset);
  if (!fromToken) {
    throw new Error(`Token ${fromAsset} not found on chain ${fromChainId}`);
  }

  // Destination token (same asset on target chain)
  const toToken = getTokenConfig(targetPool.chainId, targetPool.asset);
  if (!toToken) {
    throw new Error(
      `Token ${targetPool.asset} not found on chain ${targetPool.chainId}`,
    );
  }

  const destChainConfig = SUPPORTED_CHAINS[targetPool.chainId];
  if (!destChainConfig) {
    throw new Error(`Chain ${targetPool.chainId} not configured`);
  }

  // Parse the amount into the correct decimals
  const parsedAmount = parseUnits(fromAmount, fromToken.decimals);
  const toAmountStr = parsedAmount.toString();

  // ---- Same-chain: skip LI.FI, return a direct-deposit quote ----
  const sameChain = fromChainId === targetPool.chainId;
  if (sameChain) {
    console.log(
      "[MaxYield] Same-chain deposit detected — skipping LI.FI Composer",
    );
    return {
      quote: {
        _sameChain: true,
        fromChainId,
        toToken,
        parsedAmount: toAmountStr,
        protocol: targetPool.protocol,
        poolAddress: targetPool.poolAddress,
        aavePool: destChainConfig.aaveV3Pool,
        userAddress,
      },
      estimatedGas: "300000",
      estimatedTime: 15,
      toolName: "Direct on-chain",
      feeCostsUsd: 0,
      isSameChain: true,
    };
  }

  // ---- Cross-chain: use LI.FI Composer ----
  const contractCalls: any[] = [];

  if (targetPool.protocol === "aave-v3") {
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: toToken.address,
      toContractCallData: buildApproveCalldata(
        destChainConfig.aaveV3Pool,
        parsedAmount,
      ),
      toContractGasLimit: "100000",
    });
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: destChainConfig.aaveV3Pool,
      toContractCallData: buildAaveV3SupplyCalldata(
        toToken.address,
        parsedAmount,
        userAddress,
      ),
      toContractGasLimit: "300000",
    });
  } else if (targetPool.protocol === "morpho") {
    const vaultAddress = targetPool.poolAddress;
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: toToken.address,
      toContractCallData: buildApproveCalldata(vaultAddress, parsedAmount),
      toContractGasLimit: "100000",
    });
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: vaultAddress,
      toContractCallData: buildMorphoDepositCalldata(parsedAmount, userAddress),
      toContractGasLimit: "300000",
    });
  }

  const quoteRequest = {
    fromChain: fromChainId,
    fromToken: fromToken.address,
    fromAddress: userAddress,
    toChain: targetPool.chainId,
    toToken: toToken.address,
    toAmount: toAmountStr,
    contractCalls,
  };

  console.log("[MaxYield] LI.FI quoteRequest", quoteRequest);
  const quote = await getContractCallsQuote(quoteRequest);
  console.log("[MaxYield] LI.FI quote response", quote);

  const action = quote?.action;
  const estimate = quote?.estimate;

  return {
    quote,
    estimatedGas: estimate?.gasCosts?.[0]?.amount ?? "0",
    estimatedTime: estimate?.executionDuration ?? 0,
    toolName: action?.slippage ? `Slippage: ${action.slippage}%` : "LI.FI",
    feeCostsUsd:
      estimate?.feeCosts?.reduce(
        (sum: number, f: any) => sum + parseFloat(f.amountUSD || "0"),
        0,
      ) ?? 0,
    isSameChain: false,
  };
}

// ---------------------------------------------------------------------------
// Execute the route (bridge + deposit)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Execute SAME-CHAIN deposit directly via wallet (approve → deposit)
// ---------------------------------------------------------------------------

export async function executeSameChainDeposit(
  quoteData: any,
  walletClient: WalletClient,
  onUpdate: (update: ExecutionUpdate) => void,
): Promise<void> {
  const {
    toToken,
    parsedAmount,
    protocol,
    poolAddress,
    aavePool,
    userAddress,
  } = quoteData;
  const amount = BigInt(parsedAmount);
  const spender: Address = protocol === "aave-v3" ? aavePool : poolAddress;

  console.log("[MaxYield] executeSameChainDeposit", {
    protocol,
    spender,
    tokenAddress: toToken.address,
    amount: parsedAmount,
  });

  try {
    // Step 1 — Approve
    onUpdate({ status: "approving", message: "Approving token spend…" });
    console.log("[MaxYield] Sending approve tx…");

    const approveTx = await walletClient.writeContract({
      address: toToken.address as Address,
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [spender, amount],
      chain: walletClient.chain,
      account: userAddress as Address,
    });
    console.log("[MaxYield] Approve tx hash:", approveTx);
    onUpdate({
      status: "approving",
      message: "Approval submitted, waiting…",
      txHash: approveTx,
    });

    // Step 2 — Deposit
    onUpdate({ status: "depositing", message: "Depositing into vault…" });

    let depositTx: string;
    if (protocol === "aave-v3") {
      console.log("[MaxYield] Sending Aave V3 supply tx…");
      depositTx = await walletClient.writeContract({
        address: aavePool as Address,
        abi: AAVE_V3_POOL_ABI,
        functionName: "supply",
        args: [toToken.address as Address, amount, userAddress as Address, 0],
        chain: walletClient.chain,
        account: userAddress as Address,
      });
    } else {
      console.log("[MaxYield] Sending Morpho deposit tx…");
      depositTx = await walletClient.writeContract({
        address: poolAddress as Address,
        abi: MORPHO_VAULT_ABI,
        functionName: "deposit",
        args: [amount, userAddress as Address],
        chain: walletClient.chain,
        account: userAddress as Address,
      });
    }

    console.log("[MaxYield] Deposit tx hash:", depositTx);
    onUpdate({
      status: "completed",
      message: "Successfully deposited into yield pool!",
      txHash: depositTx,
    });
  } catch (error: any) {
    console.error("[MaxYield] Same-chain deposit error:", error);
    onUpdate({
      status: "failed",
      message:
        error?.shortMessage ??
        error?.message ??
        "Transaction failed. Please try again.",
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Execute CROSS-CHAIN route via LI.FI (bridge + deposit)
// ---------------------------------------------------------------------------

export async function executeComposerRoute(
  quote: any,
  onUpdate: (update: ExecutionUpdate) => void,
): Promise<void> {
  const { executeRoute, convertQuoteToRoute } = await import("@lifi/sdk");

  console.log("[MaxYield] executeComposerRoute — converting quote to route…");
  const route = convertQuoteToRoute(quote);
  console.log("[MaxYield] Route:", route);

  onUpdate({
    status: "approving",
    message: "Requesting wallet approval…",
  });

  try {
    await executeRoute(route, {
      updateRouteHook(updatedRoute: any) {
        const currentStep = updatedRoute.steps?.[updatedRoute.steps.length - 1];
        const process = currentStep?.execution?.process;

        if (!process || process.length === 0) return;

        const latest = process[process.length - 1];
        console.log("[MaxYield] Route update:", latest.type, latest.message);

        if (latest.type === "TOKEN_ALLOWANCE") {
          onUpdate({
            status: "approving",
            message: latest.message ?? "Approving token…",
            txHash: latest.txHash,
            substatus: latest.substatus,
          });
        } else if (latest.type === "CROSS_CHAIN" || latest.type === "SWAP") {
          onUpdate({
            status: "bridging",
            message: latest.message ?? "Bridging assets cross-chain…",
            txHash: latest.txHash,
            substatus: latest.substatus,
          });
        } else {
          onUpdate({
            status: "depositing",
            message: latest.message ?? "Depositing into yield protocol…",
            txHash: latest.txHash,
            substatus: latest.substatus,
          });
        }
      },
    });

    console.log("[MaxYield] Cross-chain route completed.");
    onUpdate({
      status: "completed",
      message: "Successfully deposited into yield pool!",
    });
  } catch (error: any) {
    console.error("[MaxYield] Cross-chain route error:", error);
    onUpdate({
      status: "failed",
      message: error?.message ?? "Transaction failed. Please try again.",
    });
    throw error;
  }
}
