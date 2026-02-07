import { createConfig, EVM, getContractCallsQuote } from "@lifi/sdk";
import { encodeFunctionData, type Address, parseUnits } from "viem";
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
  switchChainFn: (chainId: number) => Promise<any>
): void {
  if (_sdkInitialised) return;

  createConfig({
    integrator: LIFI_INTEGRATOR,
    providers: [
      EVM({
        getWalletClient,
        switchChain: async (chainId: number) => {
          const chain = await switchChainFn(chainId);
          return chain;
        },
      }),
    ],
  });

  _sdkInitialised = true;
}

// ---------------------------------------------------------------------------
// Build contract call data for different protocols
// ---------------------------------------------------------------------------

function buildAaveV3SupplyCalldata(
  assetAddress: Address,
  amount: bigint,
  onBehalfOf: Address
): `0x${string}` {
  return encodeFunctionData({
    abi: AAVE_V3_POOL_ABI,
    functionName: "supply",
    args: [assetAddress, amount, onBehalfOf, 0],
  });
}

function buildMorphoDepositCalldata(
  amount: bigint,
  receiver: Address
): `0x${string}` {
  return encodeFunctionData({
    abi: MORPHO_VAULT_ABI,
    functionName: "deposit",
    args: [amount, receiver],
  });
}

function buildApproveCalldata(
  spender: Address,
  amount: bigint
): `0x${string}` {
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
  params: ComposerQuoteParams
): Promise<ComposerQuoteResult> {
  const { fromChainId, fromAsset, fromAmount, userAddress, targetPool } =
    params;

  // Source token
  const fromToken = getTokenConfig(fromChainId, fromAsset);
  if (!fromToken) {
    throw new Error(
      `Token ${fromAsset} not found on chain ${fromChainId}`
    );
  }

  // Destination token (same asset on target chain)
  const toToken = getTokenConfig(targetPool.chainId, targetPool.asset);
  if (!toToken) {
    throw new Error(
      `Token ${targetPool.asset} not found on chain ${targetPool.chainId}`
    );
  }

  const destChainConfig = SUPPORTED_CHAINS[targetPool.chainId];
  if (!destChainConfig) {
    throw new Error(`Chain ${targetPool.chainId} not configured`);
  }

  // Parse the amount into the correct decimals
  const parsedAmount = parseUnits(fromAmount, fromToken.decimals);
  const toAmountStr = parsedAmount.toString();

  // Build the contract calls array
  const contractCalls: any[] = [];

  if (targetPool.protocol === "aave-v3") {
    // Approve Aave V3 Pool to spend the token
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: toToken.address,
      toContractCallData: buildApproveCalldata(
        destChainConfig.aaveV3Pool,
        parsedAmount
      ),
      toContractGasLimit: "100000",
    });

    // Supply to Aave V3
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: destChainConfig.aaveV3Pool,
      toContractCallData: buildAaveV3SupplyCalldata(
        toToken.address,
        parsedAmount,
        userAddress
      ),
      toContractGasLimit: "300000",
    });
  } else if (targetPool.protocol === "morpho") {
    const vaultAddress = targetPool.poolAddress;

    // Approve Morpho vault to spend the token
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: toToken.address,
      toContractCallData: buildApproveCalldata(vaultAddress, parsedAmount),
      toContractGasLimit: "100000",
    });

    // Deposit into Morpho vault
    contractCalls.push({
      fromAmount: toAmountStr,
      fromTokenAddress: toToken.address,
      toContractAddress: vaultAddress,
      toContractCallData: buildMorphoDepositCalldata(
        parsedAmount,
        userAddress
      ),
      toContractGasLimit: "300000",
    });
  }

  // Call LI.FI Composer
  const quoteRequest = {
    fromChain: fromChainId,
    fromToken: fromToken.address,
    fromAddress: userAddress,
    toChain: targetPool.chainId,
    toToken: toToken.address,
    toAmount: toAmountStr,
    contractCalls,
  };

  const quote = await getContractCallsQuote(quoteRequest);

  // Extract useful info from quote
  const action = quote?.action;
  const estimate = quote?.estimate;

  return {
    quote,
    estimatedGas: estimate?.gasCosts?.[0]?.amount ?? "0",
    estimatedTime: estimate?.executionDuration ?? 0,
    toolName: action?.slippage ? `Slippage: ${action.slippage}%` : "LI.FI",
    feeCostsUsd: estimate?.feeCosts?.reduce(
      (sum: number, f: any) => sum + parseFloat(f.amountUSD || "0"),
      0
    ) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Execute the route (bridge + deposit)
// ---------------------------------------------------------------------------

export async function executeComposerRoute(
  quote: any,
  onUpdate: (update: ExecutionUpdate) => void
): Promise<void> {
  // Dynamic import to keep the module tree-shakeable
  const { executeRoute, convertQuoteToRoute } = await import("@lifi/sdk");

  const route = convertQuoteToRoute(quote);

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
            message:
              latest.message ?? "Depositing into yield protocol…",
            txHash: latest.txHash,
            substatus: latest.substatus,
          });
        }
      },
    });

    onUpdate({
      status: "completed",
      message: "Successfully deposited into yield pool!",
    });
  } catch (error: any) {
    onUpdate({
      status: "failed",
      message: error?.message ?? "Transaction failed. Please try again.",
    });
    throw error;
  }
}
