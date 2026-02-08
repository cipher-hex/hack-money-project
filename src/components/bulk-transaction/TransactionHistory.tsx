import React from "react";
import { useChainId } from "wagmi";
import tokenInfo from "../../utils/contract-address/safePay-tokens.json";
import { motion } from "framer-motion";
import {
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { BulkTransaction } from "../../types/bulk-transaction";
import {
  formatAddress,
  formatAmount,
} from "../../utils/bulk-transaction/validation";

interface TransactionHistoryProps {
  transactions: BulkTransaction[];
  isLoading: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chainId = useChainId();

  const getTokenSymbol = (transaction: BulkTransaction) => {
    const chainConfig = tokenInfo.find((c) => c.chainId === chainId.toString());
    if (!chainConfig) return transaction.isNative ? "NATIVE" : "TOKEN";

    if (transaction.isNative) {
      return chainConfig.nativeCurrency?.symbol || "NATIVE";
    }

    const token = chainConfig.supportedTokens?.find(
      (t) => t.address.toLowerCase() === transaction.tokenAddress.toLowerCase(),
    );
    return token?.symbol || "TOKEN";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No transactions yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Your bulk transfer history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <PaperAirplaneIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Bulk Transfer to {transaction.recipientCount} Recipients
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center">
                    <ClockIcon className="w-3.5 h-3.5 mr-1" />
                    {formatDate(transaction.timestamp)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <UserGroupIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700 font-medium">
                    {transaction.recipientCount} recipients
                  </span>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700 font-medium">
                    {formatAmount(transaction.totalAmount)}{" "}
                    {getTokenSymbol(transaction)}
                  </span>
                </div>
                {!transaction.isNative &&
                  transaction.tokenAddress !==
                    "0x0000000000000000000000000000000000000000" && (
                    <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-500 mr-2">Token:</span>
                      <span className="text-gray-600 font-mono text-xs">
                        {formatAddress(transaction.tokenAddress)}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                Completed
              </span>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {formatAmount(transaction.totalAmount)}{" "}
                <span className="text-sm font-medium text-gray-500">
                  {getTokenSymbol(transaction)}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TransactionHistory;
