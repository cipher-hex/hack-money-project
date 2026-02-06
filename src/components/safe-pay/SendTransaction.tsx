"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useChainId } from "wagmi";
import { useTokenConfig, TokenSelection } from "../../hooks/useTokenConfig";
import { useTransactionType } from "../../hooks/useTransactionType";
import { useTokenApproval } from "../../hooks/useTokenApproval";
import {
  sendERC20ToWalletAddress,
  sendERC20ToUserId,
} from "../../utils/safe-payblockchain-call";
import TokenSelector from "./TokenSelector";

interface SendTransferProps {
  address: string | undefined;
  sendToWalletAddress: Function;
  sendToUserId: Function;
  getUserByUserId: Function;
  parseErrorMessage: Function;
  copyToClipboard: Function;
  fetchUserData: Function;
  fetchPendingTransactions: Function;
}

const SendTransfer: React.FC<SendTransferProps> = ({
  address,
  sendToWalletAddress,
  sendToUserId,
  getUserByUserId,
  parseErrorMessage,
  copyToClipboard,
  fetchUserData,
  fetchPendingTransactions,
}) => {
  const chainId = useChainId();
  const { selectedToken, selectToken, hasTokenSupport } = useTokenConfig();
  const [isChainSupported, setIsChainSupported] = useState(true);
  const transactionType = useTransactionType(selectedToken || undefined);

  // Token approval hook
  const tokenApproval = useTokenApproval({
    tokenAddress: selectedToken?.token.address,
    userAddress: address,
    decimals: selectedToken?.token.decimals || 18,
  });

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  // UserId search state
  const [searchedAddress, setSearchedAddress] = useState("");
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [showPasteButton, setShowPasteButton] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Update chain support status
  useEffect(() => {
    setIsChainSupported(tokenApproval.isChainSupported);
  }, [tokenApproval.isChainSupported]);

  // Check if approval is needed when amount or token changes
  useEffect(() => {
    if (amount && transactionType.isERC20Transaction && selectedToken) {
      const approvalNeeded = tokenApproval.needsApproval(amount);
      setNeedsApproval(approvalNeeded);
    } else {
      setNeedsApproval(false);
    }
  }, [
    amount,
    selectedToken,
    transactionType.isERC20Transaction,
    tokenApproval,
  ]);

  const validateForm = () => {
    if (!recipient) return "Recipient is required";
    if (!amount || parseFloat(amount) <= 0) return "Valid amount is required";
    if (!note) return "Please add a note for the transaction";
    if (parseFloat(amount) > 1000000) return "Amount exceeds maximum limit";
    return null;
  };

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setNote("");
  };

  const handleNewTransaction = () => {
    setSuccess("");
    setTransactionId("");
    resetForm();
  };

  const handleUserIdSearch = async () => {
    if (!recipient || recipient.startsWith("0x") || !address) return;

    setSearchLoading(true);
    setSearchError("");
    setShowSearchResult(false);

    try {
      const userAddress = await getUserByUserId(recipient);
      if (
        userAddress &&
        userAddress !== "0x0000000000000000000000000000000000000000"
      ) {
        setSearchedAddress(userAddress);
        setShowSearchResult(true);
        setShowPasteButton(true);
      } else {
        setSearchError("User not found");
        setShowSearchResult(false);
        setShowPasteButton(false);
      }
    } catch (err) {
      setSearchError("User not found");
      setShowSearchResult(false);
      setShowPasteButton(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePasteAddress = () => {
    setRecipient(searchedAddress);
    setShowPasteButton(false);
  };

  const handleApproval = async () => {
    if (!selectedToken || transactionType.isNativeTransaction) return;

    setIsApproving(true);
    setError("");

    try {
      await tokenApproval.approveAmount(amount);
      setNeedsApproval(false);
    } catch (err: unknown) {
      console.error("Approval error:", err);
      setError(parseErrorMessage(err));
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!selectedToken) {
      setError("Please select a token");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if approval is needed for ERC-20 tokens
    if (transactionType.isERC20Transaction && needsApproval) {
      setError("Please approve the token spending first");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      let newTransactionId;

      if (transactionType.isNativeTransaction) {
        // Use existing native currency functions
        if (recipient.startsWith("0x")) {
          newTransactionId = await sendToWalletAddress(recipient, amount, note);
        } else {
          newTransactionId = await sendToUserId(recipient, amount, note);
        }
      } else {
        // Use new ERC-20 functions
        if (recipient.startsWith("0x")) {
          newTransactionId = await sendERC20ToWalletAddress(
            selectedToken.token.address,
            recipient,
            amount,
            note,
            selectedToken.token.decimals,
            chainId,
          );
        } else {
          newTransactionId = await sendERC20ToUserId(
            selectedToken.token.address,
            recipient,
            amount,
            note,
            selectedToken.token.decimals,
            chainId,
          );
        }
      }

      setTransactionId(newTransactionId);
      setSuccess("Transaction initiated successfully!");
      resetForm();
      fetchUserData();
      fetchPendingTransactions();
    } catch (err: unknown) {
      console.error("Transfer error:", err);
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-6 text-blue-600 flex items-center space-x-2">
        <ArrowRightIcon className="w-5 h-5" />
        <span>Send Transfer</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Unsupported Chain Warning */}
        {!isChainSupported && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Smart Contract Not Deployed
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This smart contract is not deployed on the current chain.
                  Please switch to a supported network to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Token Selection */}
        {hasTokenSupport && isChainSupported && (
          <TokenSelector
            onTokenSelect={(token: TokenSelection) => {
              selectToken(token);
              setError(""); // Clear any previous errors
              setNeedsApproval(false); // Reset approval state
            }}
            address={address}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-blue-600 font-medium">Recipient</label>
            {recipient && !recipient.startsWith("0x") && (
              <button
                type="button"
                onClick={handleUserIdSearch}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
                <span>{searchLoading ? "Checking..." : "Search"}</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setShowSearchResult(false);
              setShowPasteButton(false);
              setSearchError("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x... or userId"
            required
          />

          {/* Search Result */}
          {showSearchResult && searchedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-green-700">
                    User found!
                  </p>
                  <p className="text-sm text-green-600 font-mono">
                    {searchedAddress.substring(0, 6)}...
                    {searchedAddress.substring(searchedAddress.length - 4)}
                  </p>
                </div>
                {showPasteButton && (
                  <button
                    type="button"
                    onClick={handlePasteAddress}
                    className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Search Error */}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-base font-medium text-red-700">
                {searchError}
              </p>
            </motion.div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-medium text-sm">
            Amount ({transactionType.getTokenSymbol()})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.0"
            required
            min="0"
            step="0.000000000000000001"
          />
        </div>

        <div>
          <label className="mb-2 text-gray-700 font-medium flex items-center space-x-2 text-sm">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            <span>Note</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add a note about this transaction like send to relation, payment for something, etc."
            rows={3}
            required
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <div className="text-center py-2">
              <p className="text-green-600 font-medium">{success}</p>
              {transactionId && (
                <div className="mt-2 space-y-2">
                  <p className="text-lg text-slate-700 font-medium">
                    Transaction ID:
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-mono text-lg text-blue-600">
                      {transactionId.substring(0, 8)}...
                      {transactionId.substring(transactionId.length - 6)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(transactionId, "Transaction ID")
                      }
                      className="p-1 hover:bg-blue-100 rounded transition-colors duration-200"
                      title="Copy Transaction ID"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleNewTransaction}
                className="mt-2 bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Make Another Transaction
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Approval Button for ERC-20 Tokens */}
        {transactionType.isERC20Transaction && needsApproval && !success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <ExclamationCircleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Token Approval Required
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to approve the contract to spend your{" "}
                  {selectedToken?.token.symbol} tokens.
                </p>
                <button
                  type="button"
                  onClick={handleApproval}
                  disabled={isApproving}
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
          </motion.div>
        )}

        {!success && (
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={
              isLoading ||
              !address ||
              !isChainSupported ||
              (transactionType.isERC20Transaction && needsApproval)
            }
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ArrowRightIcon className="w-5 h-5" />
                <span>Send Transaction</span>
              </>
            )}
          </button>
        )}
      </form>

      {!address && (
        <p className="text-center text-slate-500 text-sm mt-4">
          Connect your wallet to send transactions
        </p>
      )}
    </div>
  );
};

export default SendTransfer;
