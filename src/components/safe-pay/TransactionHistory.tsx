"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTokenConfig } from "../../hooks/useTokenConfig";
import {
  detectTransactionType,
  getTransactionFunction,
} from "../../hooks/useTransactionType";
import { refundERC20Transaction } from "../../utils/safe-payblockchain-call";
import { useChainId } from "wagmi";
import { formatTokenAmount } from "../../utils/formatAmount";
import {
  ArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  WalletIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

interface Transaction {
  transactionId?: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  status: number;
  note: string;
  tokenAddress?: string;
  isNative?: boolean;
}

interface TransactionHistoryProps {
  address: string | undefined;
  balance: string | null;
  nativeSymbol?: string;
  registeredUserId: string;
  transactions: Transaction[];
  refundTransaction: Function;
  parseErrorMessage: Function;
  fetchUserData: Function;
  fetchPendingTransactions: Function;
  copyToClipboard: Function;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  address,
  balance,
  nativeSymbol,
  registeredUserId,
  transactions,
  refundTransaction,
  parseErrorMessage,
  fetchUserData,
  fetchPendingTransactions,
  copyToClipboard,
}) => {
  const chainId = useChainId();
  const { getTokenByAddress, currentConfig } = useTokenConfig();
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Helper function to get token info for a transaction
  const getTokenInfo = (transaction: Transaction) => {
    const transactionType = detectTransactionType(transaction);

    if (transactionType === "native") {
      return {
        symbol: currentConfig?.nativeCurrency.symbol || "ETH",
        decimals: currentConfig?.nativeCurrency.decimals || 18,
        isNative: true,
      };
    } else {
      const tokenSelection = getTokenByAddress(transaction.tokenAddress || "");
      return {
        symbol: tokenSelection?.token.symbol || "TOKEN",
        decimals: tokenSelection?.token.decimals || 18,
        isNative: false,
      };
    }
  };

  // Debug log to see what transactions are being passed
  // console.log('🏦 TransactionHistory component received transactions:', transactions);
  // console.log('🏦 Transaction count:', transactions?.length || 0);

  const statusLabels: { [key: number]: string } = {
    0: "Pending",
    1: "Claimed",
    2: "Refunded",
  };

  const statusColors: { [key: number]: string } = {
    0: "bg-yellow-100 text-yellow-700",
    1: "bg-green-100 text-green-700",
    2: "bg-gray-100 text-gray-700",
  };

  const handleRefund = async (transactionId: string) => {
    if (!address) return;

    // Find the transaction to determine its type
    const transaction = transactions.find(
      (tx) => tx.transactionId === transactionId,
    );
    if (!transaction) return;

    const transactionType = detectTransactionType(transaction);

    setRefundLoading(transactionId);
    try {
      if (transactionType === "native") {
        await refundTransaction(transactionId);
      } else {
        await refundERC20Transaction(transactionId, chainId);
      }
      fetchUserData();
      fetchPendingTransactions();
    } catch (err: unknown) {
      console.error("Refund error:", err);
      setError(parseErrorMessage(err));
    } finally {
      setRefundLoading(null);
    }
  };

  const handleRefresh = () => {
    const refreshButton = document.getElementById("refresh-button");
    if (refreshButton) {
      refreshButton.classList.add("animate-spin");
      setTimeout(() => {
        refreshButton.classList.remove("animate-spin");
      }, 1000);
    }
    fetchUserData();
    fetchPendingTransactions();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-blue-600">
          <ArrowUpIcon className="w-5 h-5" />
          <span>Transaction History</span>
        </h2>
        <motion.button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowPathIcon id="refresh-button" className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Stats Display */}
      {address && (
        <div className="mb-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-2">
                <ArrowUpIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transfers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {transactions.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {transactions.filter((t) => t.status === 1).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {transactions.filter((t) => t.status === 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2">
                <ArrowRightIcon className="w-5 h-5 rotate-180 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Refunded</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {transactions.filter((t) => t.status === 2).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <WalletIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatTokenAmount(balance, { maxDecimals: 4 })}{" "}
                    {nativeSymbol ||
                      currentConfig?.nativeCurrency.symbol ||
                      "ETH"}
                  </p>
                </div>
              </div>
              {registeredUserId && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="text-lg font-bold text-blue-600">
                    @{registeredUserId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No transactions yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Your transactions will appear here
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Transaction ID
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Contact
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Type
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Notes
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => {
                const isOutgoing = transaction.sender_address === address;
                const contactAddress = isOutgoing
                  ? transaction.recipient_address
                  : transaction.sender_address;
                const tokenInfo = getTokenInfo(transaction);
                // Always show 3 decimal places
                const amountDisplay = formatTokenAmount(transaction.amount, {
                  maxDecimals: 6,
                });

                return (
                  <motion.tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-sm text-blue-600">
                          {transaction.transactionId
                            ? transaction.transactionId.substring(0, 6) +
                              "..." +
                              transaction.transactionId.substring(
                                transaction.transactionId.length - 4,
                              )
                            : "N/A"}
                        </div>
                        {transaction.transactionId && (
                          <button
                            onClick={() =>
                              copyToClipboard(
                                transaction.transactionId!,
                                "Transaction ID",
                              )
                            }
                            className="p-1 hover:bg-blue-100 rounded transition-colors duration-200"
                            title="Copy Transaction ID"
                          >
                            <DocumentDuplicateIcon className="w-3 h-3 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-sm text-blue-600">
                          {contactAddress.substring(0, 6)}...
                          {contactAddress.substring(contactAddress.length - 4)}
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(contactAddress, "Address")
                          }
                          className="p-1 hover:bg-blue-100 rounded transition-colors duration-200"
                          title="Copy Address"
                        >
                          <DocumentDuplicateIcon className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          isOutgoing
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOutgoing ? "Send" : "Receive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600 font-semibold">
                          {amountDisplay} {tokenInfo.symbol}
                        </span>
                        {!tokenInfo.isNative && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            ERC-20
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {transaction.note || "No notes"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[transaction.status]
                          }`}
                        >
                          {statusLabels[transaction.status]}
                        </span>
                        {transaction.status === 0 &&
                          transaction.sender_address === address && (
                            <motion.button
                              onClick={() =>
                                handleRefund(transaction.transactionId!)
                              }
                              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 flex items-center space-x-1"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={
                                refundLoading === transaction.transactionId
                              }
                            >
                              {refundLoading === transaction.transactionId ? (
                                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                              ) : (
                                <span>Refund</span>
                              )}
                            </motion.button>
                          )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
