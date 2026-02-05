"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTokenConfig } from "../../hooks/useTokenConfig";
import { detectTransactionType } from "../../hooks/useTransactionType";
import { claimERC20Transaction } from "../../utils/safe-payblockchain-call";
import { formatTokenAmount } from "../../utils/formatAmount";
import { useChainId } from "wagmi";
import {
  ArrowDownIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ClaimTransferProps {
  address: string | undefined;
  claimTransactionById: Function;
  getTransactionDetails: Function;
  parseErrorMessage: Function;
  fetchPendingTransactions: Function;
  fetchUserData: Function;
}

const ClaimTransfer: React.FC<ClaimTransferProps> = ({
  address,
  claimTransactionById,
  getTransactionDetails,
  parseErrorMessage,
  fetchPendingTransactions,
  fetchUserData,
}) => {
  const chainId = useChainId();
  const { getTokenByAddress, currentConfig } = useTokenConfig();
  // Claim form state
  const [claimInput, setClaimInput] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  // Claim transaction validation state
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [validatingTransaction, setValidatingTransaction] = useState(false);
  const [transactionFound, setTransactionFound] = useState(false);

  const handleValidateTransaction = async () => {
    if (!claimInput || !claimInput.startsWith("0x") || !address) return;

    setValidatingTransaction(true);
    setClaimError("");
    try {
      const details = await getTransactionDetails(claimInput);
      console.log("Transaction details:", details);
      if (
        details &&
        details.recipient_address === address &&
        details.status === 0
      ) {
        setTransactionDetails(details);
        setTransactionFound(true);
      } else if (details && details.status === 1) {
        setClaimError("This transaction has been claimed");
        setTransactionFound(false);
        setTransactionDetails(null);
      } else if (details && details.status === 2) {
        setClaimError("This transaction has been refunded");
        setTransactionFound(false);
        setTransactionDetails(null);
      } else if (details && details.recipient_address !== address) {
        setClaimError("You are not allowed to claim this transaction");
        setTransactionFound(false);
        setTransactionDetails(null);
      } else {
        setClaimError("Transaction not found");
        setTransactionFound(false);
        setTransactionDetails(null);
      }
    } catch (err) {
      setClaimError("Transaction not found");
      setTransactionFound(false);
      setTransactionDetails(null);
    } finally {
      setValidatingTransaction(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !claimInput) return;

    // If transaction is not found yet, validate first
    if (claimInput.startsWith("0x") && !transactionFound) {
      await handleValidateTransaction();
      return;
    }

    // If transaction is found, proceed with claiming
    setClaimLoading(true);
    setClaimError("");
    setClaimSuccess("");
    try {
      // Determine transaction type and use appropriate claim function
      if (transactionDetails) {
        const transactionType = detectTransactionType(transactionDetails);

        if (transactionType === "native") {
          await claimTransactionById(claimInput);
        } else {
          await claimERC20Transaction(claimInput, chainId);
        }
      } else {
        // Fallback to native claim if no details available
        await claimTransactionById(claimInput);
      }

      setClaimSuccess("Transaction claimed successfully!");
      setClaimInput("");
      setTransactionFound(false);
      setTransactionDetails(null);
      fetchPendingTransactions();
      fetchUserData();
    } catch (err: unknown) {
      console.error("Claim error:", err);
      setClaimError(parseErrorMessage(err));
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-6 text-blue-600 flex items-center space-x-2">
        <ArrowDownIcon className="w-5 h-5" />
        <span>Claim Transaction</span>
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        Claim by providing the correct transaction ID to claim funds sent to
        you. Use the exact transaction ID shared by the sender for secure
        claiming.
      </p>

      <form onSubmit={handleClaimSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-blue-600 font-medium">Transaction ID</label>
          </div>
          <input
            type="text"
            value={claimInput}
            onChange={(e) => {
              setClaimInput(e.target.value);
              setTransactionFound(false);
              setTransactionDetails(null);
              setClaimError("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter transaction ID (0x...)"
            required
          />

          {/* Transaction Details */}
          {transactionFound && transactionDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-green-700">
                    Claimable Transaction Found!
                  </span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Ready to claim
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <span className="text-green-600">Amount:</span>
                    <p className="font-semibold text-green-700">
                      {formatTokenAmount(transactionDetails.amount, {
                        maxDecimals: 6,
                      })}{" "}
                      {(() => {
                        const transactionType =
                          detectTransactionType(transactionDetails);
                        if (transactionType === "native") {
                          return currentConfig?.nativeCurrency.symbol || "ETH";
                        } else {
                          const tokenSelection = getTokenByAddress(
                            transactionDetails.tokenAddress || ""
                          );
                          return tokenSelection?.token.symbol || "TOKEN";
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-600">From:</span>
                    <p className="font-mono text-sm text-green-700">
                      {transactionDetails.sender_address?.substring(0, 6)}...
                      {transactionDetails.sender_address?.substring(
                        transactionDetails.sender_address.length - 4
                      )}
                    </p>
                  </div>
                </div>
                {transactionDetails.note && (
                  <div>
                    <span className="text-green-600 text-base">Note:</span>
                    <p className="text-green-700 text-base">
                      {transactionDetails.note}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {claimError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="text-base font-medium text-red-700">
                  {claimError}
                </span>
              </div>
            </motion.div>
          )}

          {claimSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-base font-medium text-green-700">
                  {claimSuccess}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={claimLoading || validatingTransaction}
        >
          {claimLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : validatingTransaction ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Checking...</span>
            </>
          ) : transactionFound ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              <span>Claim Now</span>
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Find Claim</span>
            </>
          )}
        </button>
      </form>

      {!address && (
        <p className="text-center text-slate-500 text-sm mt-4">
          Connect your wallet to claim transactions
        </p>
      )}
    </div>
  );
};

export default ClaimTransfer;
