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
      (t) => t.address.toLowerCase() === transaction.tokenAddress.toLowerCase()
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
          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Bulk Transfer to {transaction.recipientCount} Recipients
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(transaction.timestamp)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {transaction.recipientCount} recipients
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatAmount(transaction.totalAmount)}{" "}
                    {getTokenSymbol(transaction)}
                  </span>
                </div>
                {!transaction.isNative &&
                  transaction.tokenAddress !==
                    "0x0000000000000000000000000000000000000000" && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500">Token:</span>
                      <span className="text-gray-600 font-mono text-xs">
                        {formatAddress(transaction.tokenAddress)}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
              <p className="text-sm font-medium text-gray-900 mt-2">
                {formatAmount(transaction.totalAmount)}{" "}
                {getTokenSymbol(transaction)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TransactionHistory;
