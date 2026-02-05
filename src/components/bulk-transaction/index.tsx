"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  PlusIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useBulkTransaction } from "../../hooks/useBulkTransaction";
import AddRecipient from "./AddRecipient";
import RecipientsList from "./RecipientsList";
import BulkTransferForm from "./BulkTransferForm";
import TransactionHistory from "./TransactionHistory";
import BulkTransactionStats from "./BulkTransactionStats";
import {
  Recipient,
  RecipientFormData,
  RecipientWithAmount,
} from "../../types/bulk-transaction";
import { toast } from "react-toastify";
import MainHeader from "../shared/MainHeader";

const BulkTransactionPage: React.FC = () => {
  const {
    recipients,
    selectedRecipients,
    transactionHistory,
    isLoading,
    error,
    isConnected,
    address,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    bulkTransferNative,
    bulkTransferERC20,
    toggleRecipientSelection,
    clearSelection,
    selectAllRecipients,
    refreshData,
  } = useBulkTransaction();

  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"recipients" | "history">(
    "recipients"
  );

  // Handle add recipient
  const handleAddRecipient = async (data: RecipientFormData) => {
    try {
      await addRecipient(data);
      setShowAddRecipient(false);
      toast.success("Recipient added successfully!");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Handle edit recipient
  const handleEditRecipient = async (data: RecipientFormData) => {
    if (!editingRecipient?.id) return;

    try {
      await updateRecipient(editingRecipient.id, data);
      setEditingRecipient(null);
      toast.success("Recipient updated successfully!");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Handle delete recipient
  const handleDeleteRecipient = async (recipientId: number) => {
    if (!confirm("Are you sure you want to delete this recipient?")) return;

    try {
      await deleteRecipient(recipientId);
      toast.success("Recipient deleted successfully!");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Handle bulk transfer
  const handleBulkTransfer = async (
    recipientsWithAmounts: RecipientWithAmount[],
    tokenAddress?: string,
    decimals: number = 18
  ) => {
    const recipientIds = recipientsWithAmounts.map((r) => r.id!);
    const amounts = recipientsWithAmounts.map((r) => r.amount);

    try {
      if (tokenAddress) {
        await bulkTransferERC20(tokenAddress, recipientIds, amounts, decimals);
      } else {
        await bulkTransferNative(recipientIds, amounts);
      }

      setShowTransferForm(false);
      clearSelection();
      toast.success("Bulk transfer completed successfully!");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Get selected recipients details
  const getSelectedRecipients = () => {
    return recipients.filter((r) => selectedRecipients.includes(r.id!));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-500">
              Please connect your wallet to manage bulk transactions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {" "}
      {/* Header */}
      <MainHeader />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
                <span>Bulk Transaction Manager</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Manage recipients and send bulk transactions efficiently
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddRecipient(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Recipient</span>
              </button>
              {selectedRecipients.length > 0 && (
                <button
                  onClick={() => setShowTransferForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Bulk Send ({selectedRecipients.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <BulkTransactionStats
          totalRecipients={recipients.length}
          totalTransactions={transactionHistory.length}
          selectedCount={selectedRecipients.length}
        />

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("recipients")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === "recipients"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Recipients ({recipients.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Transaction History ({transactionHistory.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "recipients" ? (
                <motion.div
                  key="recipients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RecipientsList
                    recipients={recipients}
                    selectedRecipients={selectedRecipients}
                    isLoading={isLoading}
                    onToggleSelect={toggleRecipientSelection}
                    onSelectAll={selectAllRecipients}
                    onClearSelection={clearSelection}
                    onEdit={(recipient: Recipient) =>
                      setEditingRecipient(recipient)
                    }
                    onDelete={handleDeleteRecipient}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TransactionHistory
                    transactions={transactionHistory}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add/Edit Recipient Modal */}
        <AddRecipient
          isOpen={showAddRecipient || !!editingRecipient}
          onClose={() => {
            setShowAddRecipient(false);
            setEditingRecipient(null);
          }}
          onSubmit={editingRecipient ? handleEditRecipient : handleAddRecipient}
          editingRecipient={editingRecipient}
          isLoading={isLoading}
        />

        {/* Bulk Transfer Form Modal */}
        {showTransferForm && (
          <BulkTransferForm
            recipients={getSelectedRecipients()}
            onClose={() => setShowTransferForm(false)}
            onSubmit={handleBulkTransfer}
            isLoading={isLoading}
            address={address}
          />
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BulkTransactionPage;
