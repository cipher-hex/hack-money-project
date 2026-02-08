import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useTokenConfig, TokenSelection } from "../../hooks/useTokenConfig";
import { useTokenApproval } from "../../hooks/useTokenApproval";
import { useTransactionType } from "../../hooks/useTransactionType";
import { Recipient, RecipientWithAmount } from "../../types/bulk-transaction";
import bulkTransactionAddresses from "../../utils/contract-address/bulk-transaction-addresses.json";
import {
  validateAmount,
  formatAddress,
  formatAmount,
} from "../../utils/bulk-transaction/validation";
import TokenSelector from "../safe-pay/TokenSelector";
import { parseUnits } from "viem";
import { useChainId } from "wagmi";

interface BulkTransferFormProps {
  recipients: Recipient[];
  onClose: () => void;
  onSubmit: (
    recipients: RecipientWithAmount[],
    tokenAddress?: string,
    decimals?: number,
  ) => Promise<void>;
  isLoading?: boolean;
  address?: string;
}

const BulkTransferForm: React.FC<BulkTransferFormProps> = ({
  recipients,
  onClose,
  onSubmit,
  isLoading = false,
  address,
}) => {
  const chainId = useChainId();
  const { selectedToken, selectToken } = useTokenConfig();
  const transactionType = useTransactionType(selectedToken || undefined);

  const [recipientsWithAmounts, setRecipientsWithAmounts] = useState<
    RecipientWithAmount[]
  >([]);
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [totalAmount, setTotalAmount] = useState("0");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [formError, setFormError] = useState("");

  // Get BulkTransactionManager contract address for current chain
  const getBulkTransactionContractAddress = (): string | undefined => {
    const deployment = bulkTransactionAddresses.find(
      (d) => d.chainId === chainId.toString(),
    );
    return deployment?.contractAddress;
  };

  // Token approval hook
  const tokenApproval = useTokenApproval({
    tokenAddress: selectedToken?.token.address,
    userAddress: address,
    decimals: selectedToken?.token.decimals || 18,
    spenderAddress: getBulkTransactionContractAddress(), // Approve BulkTransactionManager
  });

  // Initialize recipients with amounts
  useEffect(() => {
    const initialRecipients = recipients.map((r) => ({
      ...r,
      amount: "",
    }));
    setRecipientsWithAmounts(initialRecipients);
  }, [recipients]);

  // Calculate total amount whenever amounts change
  useEffect(() => {
    const total = recipientsWithAmounts.reduce((sum, r) => {
      const amount = parseFloat(r.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    setTotalAmount(total.toString());

    // Check if approval is needed for ERC20 tokens
    if (transactionType.isERC20Transaction && total > 0) {
      const approvalNeeded = tokenApproval.needsApproval(total.toString());
      setNeedsApproval(approvalNeeded);
    } else {
      setNeedsApproval(false);
    }
  }, [
    recipientsWithAmounts,
    transactionType.isERC20Transaction,
    tokenApproval,
  ]);

  const handleAmountChange = (index: number, amount: string) => {
    const newRecipients = [...recipientsWithAmounts];
    newRecipients[index] = { ...newRecipients[index], amount };
    setRecipientsWithAmounts(newRecipients);

    // Validate amount
    const error = validateAmount(amount);
    if (error) {
      setErrors({ ...errors, [index]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleDistributeEqually = () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setFormError("Please enter a total amount to distribute");
      return;
    }

    const equalAmount = (parseFloat(totalAmount) / recipients.length).toFixed(
      6,
    );
    const newRecipients = recipientsWithAmounts.map((r) => ({
      ...r,
      amount: equalAmount,
    }));
    setRecipientsWithAmounts(newRecipients);
    setErrors({});
    setFormError("");
  };

  const handleApproval = async () => {
    if (!selectedToken || transactionType.isNativeTransaction) return;

    setIsApproving(true);
    setFormError("");

    try {
      await tokenApproval.approveAmount(totalAmount);
      setNeedsApproval(false);
    } catch (err: any) {
      console.error("Approval error:", err);
      setFormError(err.message || "Failed to approve token");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate all amounts
    let hasError = false;
    const newErrors: { [key: number]: string } = {};

    recipientsWithAmounts.forEach((r, index) => {
      const error = validateAmount(r.amount);
      if (error) {
        newErrors[index] = error;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      setFormError("Please fix all errors before submitting");
      return;
    }

    if (parseFloat(totalAmount) <= 0) {
      setFormError("Total amount must be greater than 0");
      return;
    }

    // Check if approval is needed
    if (transactionType.isERC20Transaction && needsApproval) {
      setFormError("Please approve the token spending first");
      return;
    }

    try {
      await onSubmit(
        recipientsWithAmounts,
        transactionType.isNativeTransaction
          ? undefined
          : selectedToken?.token.address,
        selectedToken?.token.decimals,
      );
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to complete bulk transfer");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden flex flex-col border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Transfer</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sending to{" "}
                <span className="font-semibold text-blue-600">
                  {recipients.length}
                </span>{" "}
                recipients
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {/* Token Selection */}
            <div className="mb-6">
              <TokenSelector
                onTokenSelect={(token: TokenSelection) => {
                  selectToken(token);
                  setFormError("");
                  setNeedsApproval(false);
                }}
                address={address}
              />
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-hidden flex flex-col min-h-0"
            >
              {/* Recipients List with Amounts */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 mb-6">
                {recipientsWithAmounts.map((recipient, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {recipient.fullName}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                            {recipient.relation}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {formatAddress(recipient.walletAddress)}
                        </p>
                      </div>
                      <div className="w-48 flex-shrink-0">
                        <div className="relative">
                          <input
                            type="number"
                            value={recipient.amount}
                            onChange={(e) =>
                              handleAmountChange(index, e.target.value)
                            }
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              errors[index]
                                ? "border-red-300 focus:ring-red-200"
                                : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                            } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 bg-white transition-all duration-200`}
                            placeholder="0.00"
                            step="0.000000000000000001"
                            disabled={isLoading}
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <span className="text-xs font-semibold text-gray-400">
                              {selectedToken?.token.symbol || "ETH"}
                            </span>
                          </div>
                        </div>
                        {errors[index] && (
                          <p className="text-xs text-red-600 mt-1 ml-1">
                            {errors[index]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary and Actions */}
              <div className="border-t border-gray-100 pt-6 space-y-6">
                {/* Total and Distribute Button */}
                <div className="flex items-center justify-between bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Total Amount to Send
                    </p>
                    <p className="text-2xl font-bold text-blue-900 tracking-tight">
                      {formatAmount(totalAmount)}{" "}
                      <span className="text-lg font-semibold text-blue-700">
                        {transactionType.getTokenSymbol()}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDistributeEqually}
                    className="px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  >
                    Distribute Equally
                  </button>
                </div>

                {/* Approval Section for ERC20 */}
                {transactionType.isERC20Transaction && needsApproval && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-800">
                        Token Approval Required
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1 mb-3">
                        You need to approve the contract to spend{" "}
                        <span className="font-medium">
                          {formatAmount(totalAmount)}{" "}
                          {selectedToken?.token.symbol}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={handleApproval}
                        disabled={isApproving}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                      >
                        {isApproving ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Approve {selectedToken?.token.symbol}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2"
                  >
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200"
                    disabled={
                      isLoading ||
                      (transactionType.isERC20Transaction && needsApproval)
                    }
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Processing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5" />
                        <span>Send to {recipients.length} Recipients</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkTransferForm;
