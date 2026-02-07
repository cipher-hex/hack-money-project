import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useWalletClient, useSwitchChain } from "wagmi";
import MainHeader from "../components/shared/MainHeader";
import {
  getAllChainConfigs,
  SUPPORTED_ASSETS,
  getTokenConfig,
  type SupportedAsset,
  type ChainConfig,
} from "../config/yieldConfig";
import { fetchYieldPools, type YieldPool } from "../services/yieldService";
import {
  initLifiSdk,
  getComposerQuote,
  executeComposerRoute,
  executeSameChainDeposit,
  type ExecutionUpdate,
  type ExecutionStatus,
  type ComposerQuoteResult,
} from "../services/lifiComposer";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ status: ExecutionStatus }> = ({ status }) => {
  const map: Record<
    ExecutionStatus,
    { bg: string; text: string; label: string }
  > = {
    idle: { bg: "bg-gray-100", text: "text-gray-600", label: "Ready" },
    approving: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Approving",
    },
    bridging: { bg: "bg-blue-100", text: "text-blue-700", label: "Bridging" },
    depositing: {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      label: "Depositing",
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Completed",
    },
    failed: { bg: "bg-red-100", text: "text-red-700", label: "Failed" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}
    >
      {status !== "idle" && status !== "completed" && status !== "failed" && (
        <span className="w-2 h-2 mr-2 rounded-full bg-current animate-pulse" />
      )}
      {s.label}
    </span>
  );
};

const ProgressStepper: React.FC<{ status: ExecutionStatus }> = ({ status }) => {
  const steps: { key: ExecutionStatus; label: string }[] = [
    { key: "approving", label: "Approve" },
    { key: "bridging", label: "Bridge" },
    { key: "depositing", label: "Deposit" },
    { key: "completed", label: "Done" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto my-6">
      {steps.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx || status === "completed";
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${isActive ? "text-blue-700" : "text-gray-500"}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${isDone ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const MaxYieldPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // Source config
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>("USDC");
  const [amount, setAmount] = useState<string>("");

  // Yield data
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  // Quote & execution
  const [selectedPool, setSelectedPool] = useState<YieldPool | null>(null);
  const [quoteResult, setQuoteResult] = useState<ComposerQuoteResult | null>(
    null,
  );
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus>("idle");
  const [executionMessage, setExecutionMessage] = useState("");
  const [executionTxHash, setExecutionTxHash] = useState<string | null>(null);

  // Pagination for yield table
  const [visibleCount, setVisibleCount] = useState(10);

  const chains = getAllChainConfigs();

  // -----------------------------------------------------------------------
  // Init LI.FI SDK when wallet is available
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!walletClient || !switchChainAsync) return;

    initLifiSdk(
      async () => walletClient,
      async (chainId: number) => {
        await switchChainAsync({ chainId });
        return walletClient;
      },
    );
  }, [walletClient, switchChainAsync]);

  // -----------------------------------------------------------------------
  // Fetch yield pools whenever the selected asset changes
  // -----------------------------------------------------------------------

  const loadPools = useCallback(async () => {
    setLoadingPools(true);
    setPoolError(null);
    setVisibleCount(10);
    console.log(`[MaxYield] Fetching yield pools for ${selectedAsset}…`);
    try {
      const data = await fetchYieldPools(selectedAsset);
      console.log(`[MaxYield] Fetched ${data.length} pools`);
      setPools(data);
    } catch (err: any) {
      console.error("[MaxYield] Pool fetch error:", err);
      setPoolError(err.message ?? "Failed to fetch yield data");
    } finally {
      setLoadingPools(false);
    }
  }, [selectedAsset]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // -----------------------------------------------------------------------
  // Get quote for a specific pool
  // -----------------------------------------------------------------------

  const handleGetQuote = async (pool: YieldPool) => {
    if (!address || !amount || parseFloat(amount) <= 0) return;

    console.log("[MaxYield] handleGetQuote", {
      pool: pool.id,
      chain: pool.chain,
      protocol: pool.protocol,
    });
    setSelectedPool(pool);
    setQuoteResult(null);
    setQuoteError(null);
    setQuoting(true);
    setExecutionStatus("idle");
    setExecutionMessage("");
    setExecutionTxHash(null);

    try {
      const result = await getComposerQuote({
        fromChainId: selectedChainId,
        fromAsset: selectedAsset,
        fromAmount: amount,
        userAddress: address as `0x${string}`,
        targetPool: pool,
      });
      console.log("[MaxYield] Quote result:", result);
      setQuoteResult(result);
    } catch (err: any) {
      console.error("[MaxYield] Quote error:", err);
      setQuoteError(err.message ?? "Failed to get quote");
    } finally {
      setQuoting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Execute the route
  // -----------------------------------------------------------------------

  const handleExecute = async () => {
    if (!quoteResult) return;

    setExecutionStatus("approving");
    setExecutionMessage("Starting transaction…");

    const onUpdate = (update: ExecutionUpdate) => {
      console.log(
        "[MaxYield] Execution update:",
        update.status,
        update.message,
      );
      setExecutionStatus(update.status);
      setExecutionMessage(update.message);
      if (update.txHash) setExecutionTxHash(update.txHash);
    };

    try {
      if (quoteResult.isSameChain) {
        // Same-chain: direct approve + deposit via wallet
        if (!walletClient) {
          onUpdate({ status: "failed", message: "Wallet not connected" });
          return;
        }
        console.log("[MaxYield] Executing same-chain deposit…");
        await executeSameChainDeposit(
          quoteResult.quote,
          walletClient,
          onUpdate,
        );
      } else {
        // Cross-chain: LI.FI Composer
        console.log("[MaxYield] Executing cross-chain route via LI.FI…");
        await executeComposerRoute(quoteResult.quote, onUpdate);
      }
    } catch {
      // Error handled inside the execution callbacks
    }
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const sourceChain = chains.find((c) => c.id === selectedChainId);
  const hasToken = !!getTokenConfig(selectedChainId, selectedAsset);

  const formatTvl = (tvl: number) => {
    if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const getExplorerTxUrl = (chainId: number, hash: string) => {
    const chain = chains.find((c) => c.id === chainId);
    return chain ? `${chain.explorer}/tx/${hash}` : `#`;
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <MainHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3">
            Max Yield Optimizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the highest APY for your stablecoins across chains. Bridge
            &amp; deposit in a single transaction powered by LI.FI Composer.
          </p>
        </div>

        {/* ---- How It Works ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              step: "1",
              title: "Choose Asset",
              desc: "Select your source chain and stablecoin (USDC or USDT) with the amount you want to deposit.",
            },
            {
              step: "2",
              title: "Compare Yields",
              desc: "Live APY data from Aave V3 and Morpho across 6 chains, sorted by highest yield.",
            },
            {
              step: "3",
              title: "One-Click Deposit",
              desc: "LI.FI Composer bridges your asset cross-chain and deposits it into the yield pool — all in one transaction.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ---- Source Config Panel ---- */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            1. Select Source
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chain Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Chain
              </label>
              <select
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                {chains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stablecoin
              </label>
              <div className="flex gap-3">
                {SUPPORTED_ASSETS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAsset(a)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      selectedAsset === a
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {!hasToken && (
                <p className="mt-1 text-xs text-amber-600">
                  {selectedAsset} is not available on {sourceChain?.name}. You
                  can still bridge from this chain via LI.FI.
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  {selectedAsset}
                </span>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              Connect your wallet to get quotes and execute transactions.
            </div>
          )}
        </div>

        {/* ---- Yield Comparison Table ---- */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              2. Compare Yields — {selectedAsset}
            </h2>
            <button
              onClick={loadPools}
              disabled={loadingPools}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {loadingPools ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {poolError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
              {poolError}
            </div>
          )}

          {loadingPools ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-sm">Fetching live APY data…</p>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-1">No pools found</p>
              <p className="text-sm">Try a different asset or refresh.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Protocol</th>
                    <th className="pb-3 pr-4">Chain</th>
                    <th className="pb-3 pr-4 text-right">APY</th>
                    <th className="pb-3 pr-4 text-right">Base APY</th>
                    <th className="pb-3 pr-4 text-right">Reward APY</th>
                    <th className="pb-3 pr-4 text-right">TVL</th>
                    <th className="pb-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.slice(0, visibleCount).map((pool, idx) => (
                    <tr
                      key={pool.id}
                      className={`border-b border-gray-50 transition-colors hover:bg-blue-50/50 ${
                        pool.isBest ? "bg-green-50/50" : ""
                      } ${
                        selectedPool?.id === pool.id
                          ? "ring-2 ring-blue-300 bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="py-4 pr-4 font-medium text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {pool.protocolLabel}
                          </span>
                          {pool.isBest && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              BEST
                            </span>
                          )}
                        </div>
                        {pool.poolMeta && (
                          <span className="text-xs text-gray-400">
                            {pool.poolMeta}
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-medium text-gray-700">
                          {pool.chain}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <span
                          className={`font-bold ${
                            pool.apy >= 5
                              ? "text-green-600"
                              : pool.apy >= 2
                                ? "text-blue-600"
                                : "text-gray-700"
                          }`}
                        >
                          {pool.apy.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right text-gray-600">
                        {pool.apyBase.toFixed(2)}%
                      </td>
                      <td className="py-4 pr-4 text-right text-gray-600">
                        {pool.apyReward.toFixed(2)}%
                      </td>
                      <td className="py-4 pr-4 text-right text-gray-600 font-medium">
                        {formatTvl(pool.tvlUsd)}
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleGetQuote(pool)}
                          disabled={
                            !isConnected ||
                            !amount ||
                            parseFloat(amount) <= 0 ||
                            quoting
                          }
                          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {quoting && selectedPool?.id === pool.id
                            ? "Quoting…"
                            : "Deposit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Load More button */}
              {visibleCount < pools.length && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Show More ({pools.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Quote & Execution Panel ---- */}
        {(quoteResult || quoteError || quoting) && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              3. Review &amp; Execute
            </h2>

            {quoting && (
              <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm">Getting best route…</span>
              </div>
            )}

            {quoteError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <p className="font-semibold mb-1">Quote Failed</p>
                <p>{quoteError}</p>
              </div>
            )}

            {quoteResult && selectedPool && (
              <div>
                {/* Quote summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">From</p>
                    <p className="font-semibold text-gray-800">
                      {amount} {selectedAsset}
                    </p>
                    <p className="text-xs text-gray-500">{sourceChain?.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">To</p>
                    <p className="font-semibold text-gray-800">
                      {selectedPool.protocolLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedPool.chain}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">APY</p>
                    <p className="font-bold text-green-600 text-lg">
                      {selectedPool.apy.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Est. Time</p>
                    <p className="font-semibold text-gray-800">
                      ~{Math.ceil(quoteResult.estimatedTime / 60)} min
                    </p>
                    <p className="text-xs text-gray-500">
                      Fees: ${quoteResult.feeCostsUsd.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Progress stepper (visible during execution) */}
                {executionStatus !== "idle" && (
                  <div className="mb-6">
                    <ProgressStepper status={executionStatus} />
                    <div className="text-center">
                      <StatusBadge status={executionStatus} />
                      <p className="mt-2 text-sm text-gray-600">
                        {executionMessage}
                      </p>
                      {executionTxHash && (
                        <a
                          href={getExplorerTxUrl(
                            selectedPool.chainId === selectedChainId
                              ? selectedChainId
                              : selectedPool.chainId,
                            executionTxHash,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-blue-600 underline"
                        >
                          View on explorer →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Execute button */}
                {executionStatus === "idle" && (
                  <button
                    onClick={handleExecute}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 text-base"
                  >
                    Confirm &amp; Execute Cross-Chain Deposit
                  </button>
                )}

                {executionStatus === "completed" && (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-bold text-lg mb-2">
                      Deposit Successful!
                    </p>
                    <p className="text-sm text-gray-500">
                      Your {selectedAsset} is now earning{" "}
                      <span className="font-semibold text-green-600">
                        {selectedPool.apy.toFixed(2)}% APY
                      </span>{" "}
                      on {selectedPool.protocolLabel} ({selectedPool.chain}).
                    </p>
                  </div>
                )}

                {executionStatus === "failed" && (
                  <button
                    onClick={() => {
                      setExecutionStatus("idle");
                      setExecutionMessage("");
                      setExecutionTxHash(null);
                    }}
                    className="w-full py-3 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <div className="text-center text-xs text-gray-400 pb-8">
          APY data sourced from DeFi Llama · Cross-chain routing by LI.FI ·
          Yield protocols: Aave V3, Morpho
        </div>
      </div>
    </div>
  );
};

export default MaxYieldPage;
