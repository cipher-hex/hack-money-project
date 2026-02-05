import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { toast } from "react-toastify";
import {
  addRecipient,
  updateRecipient,
  deleteRecipient,
  bulkTransferNative,
  bulkTransferERC20,
  getRecipients,
  getTransactionHistory,
  getRecipientCount,
  setBulkTransactionWagmiConfig,
} from "../utils/bulk-transaction/contract-calls";
import {
  Recipient,
  BulkTransaction,
  RecipientFormData,
  BulkTransactionState,
} from "../types/bulk-transaction";

export const useBulkTransaction = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const [state, setState] = useState<BulkTransactionState>({
    recipients: [],
    selectedRecipients: [],
    transactionHistory: [],
    isLoading: false,
    error: null,
    success: null,
  });

  // Set wagmi config on mount
  useEffect(() => {
    if (config) {
      setBulkTransactionWagmiConfig(config);
    }
  }, [config]);

  // Fetch recipients and transaction history
  const fetchData = useCallback(async () => {
    if (!address || !isConnected) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [recipients, history] = await Promise.all([
        getRecipients(address, chainId),
        getTransactionHistory(address, chainId),
      ]);

      setState((prev) => ({
        ...prev,
        recipients,
        transactionHistory: history,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to fetch data",
        isLoading: false,
      }));
    }
  }, [address, chainId, isConnected]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add recipient
  const handleAddRecipient = async (recipientData: RecipientFormData) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const hash = await addRecipient(recipientData, chainId);

      toast.success("Recipient added successfully!");
      setState((prev) => ({
        ...prev,
        success: "Recipient added successfully!",
      }));

      // Refresh recipients list
      await fetchData();

      return hash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to add recipient";
      console.error("Add recipient error:", error);
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  };

  // Update recipient
  const handleUpdateRecipient = async (
    recipientId: number,
    recipientData: RecipientFormData
  ) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const hash = await updateRecipient(recipientId, recipientData, chainId);

      toast.success("Recipient updated successfully!");
      setState((prev) => ({
        ...prev,
        success: "Recipient updated successfully!",
      }));

      // Refresh recipients list
      await fetchData();

      return hash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update recipient";
      console.error("Update recipient error:", error);
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  };

  // Delete recipient
  const handleDeleteRecipient = async (recipientId: number) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const hash = await deleteRecipient(recipientId, chainId);

      toast.success("Recipient deleted successfully!");
      setState((prev) => ({
        ...prev,
        success: "Recipient deleted successfully!",
      }));

      // Refresh recipients list
      await fetchData();

      return hash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete recipient";
      console.error("Delete recipient error:", error);
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  };

  // Bulk transfer native tokens
  const handleBulkTransferNative = async (
    recipientIds: number[],
    amounts: string[]
  ) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const hash = await bulkTransferNative(recipientIds, amounts, chainId);

      toast.success("Bulk transfer completed successfully!");
      setState((prev) => ({ ...prev, success: "Bulk transfer completed!" }));

      // Refresh transaction history
      await fetchData();

      return hash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to complete bulk transfer";
      console.error("Bulk transfer error:", error);
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  };

  // Bulk transfer ERC20 tokens
  const handleBulkTransferERC20 = async (
    tokenAddress: string,
    recipientIds: number[],
    amounts: string[],
    decimals: number = 18
  ) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const hash = await bulkTransferERC20(
        tokenAddress,
        recipientIds,
        amounts,
        decimals,
        chainId
      );

      toast.success("Bulk transfer completed successfully!");
      setState((prev) => ({ ...prev, success: "Bulk transfer completed!" }));

      // Refresh transaction history
      await fetchData();

      return hash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to complete bulk transfer";
      console.error("Bulk transfer error:", error);
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  };

  // Toggle recipient selection
  const toggleRecipientSelection = (recipientId: number) => {
    setState((prev) => {
      const isSelected = prev.selectedRecipients.includes(recipientId);
      const newSelection = isSelected
        ? prev.selectedRecipients.filter((id) => id !== recipientId)
        : [...prev.selectedRecipients, recipientId];

      return { ...prev, selectedRecipients: newSelection };
    });
  };

  // Clear selection
  const clearSelection = () => {
    setState((prev) => ({ ...prev, selectedRecipients: [] }));
  };

  // Select all recipients
  const selectAllRecipients = () => {
    const allIds = state.recipients
      .map((r) => r.id!)
      .filter((id) => id !== undefined);
    setState((prev) => ({ ...prev, selectedRecipients: allIds }));
  };

  return {
    // State
    recipients: state.recipients,
    selectedRecipients: state.selectedRecipients,
    transactionHistory: state.transactionHistory,
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    isConnected,
    address,
    chainId,

    // Actions
    addRecipient: handleAddRecipient,
    updateRecipient: handleUpdateRecipient,
    deleteRecipient: handleDeleteRecipient,
    bulkTransferNative: handleBulkTransferNative,
    bulkTransferERC20: handleBulkTransferERC20,
    toggleRecipientSelection,
    clearSelection,
    selectAllRecipients,
    refreshData: fetchData,
  };
};
