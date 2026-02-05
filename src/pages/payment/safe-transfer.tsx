"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, useConfig, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseErrorMessage } from "../../utils/errorHandler";
import { setWagmiConfig } from "../../utils/safe-payblockchain-call";
import {
  sendToWalletAddress,
  sendToUserId,
  claimTransactionById,
  getPendingTransactions,
  getTransactionDetails,
  getUserProfile,
  getUserByAddress,
  getUserByUserId,
  refundTransaction,
  registerUserId,
} from "../../utils/safe-payblockchain-call";

// Import our new components
import SendTransfer from "../../components/safe-pay/SendTransaction";
import ClaimTransfer from "../../components/safe-pay/ClaimTransaction";
import TransactionHistory from "../../components/safe-pay/TransactionHistory";
import RegisterUsername from "../../components/safe-pay/RegisterUserid";
import EnsResolver from "../../components/safe-pay/EnsResolver";
import HnsResolver from "../../components/safe-pay/HnsResolver";
import MainHeader from "../../components/shared/MainHeader";

// Interfaces
interface Transaction {
  transactionId?: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  timestamp: number;
  status: number;
  note: string;
}

interface PendingTransaction {
  sender_address: string;
  amount: string;
  timestamp: Date;
  note: string;
  id: string;
}

// Main content component that uses wallet context
function SafeTransferContent() {
  // Shared state for all components
  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [registeredUserId, setRegisteredUserId] = useState("");

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const config = useConfig();
  const chainId = useChainId();

  // Set wagmi config for blockchain calls
  useEffect(() => {
    setWagmiConfig(config);
  }, [config]);

  // Copy function used by multiple components
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log(`${type} copied to clipboard:`, text);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Fetch data functions
  const fetchPendingTransactions = useCallback(async () => {
    if (!address) return;
    try {
      const transactionIds = (await getPendingTransactions(
        address
      )) as string[];

      // Check if we have valid transaction IDs
      if (!transactionIds || transactionIds.length === 0) {
        setPendingTransactions([]);
        return;
      }

      const transactions = await Promise.all(
        transactionIds.map(async (id: string) => {
          try {
            const details = await getTransactionDetails(id);
            return {
              ...details,
              id,
              timestamp: new Date(details.timestamp * 1000),
            };
          } catch (err) {
            console.error(`Failed to fetch pending transaction ${id}:`, err);
            return null;
          }
        })
      );

      // Filter out null values (failed transactions)
      const validTransactions = transactions.filter((tx) => tx !== null);
      setPendingTransactions(validTransactions);
    } catch (err: unknown) {
      console.error("Error fetching pending transactions:", err);
      setPendingTransactions([]);
    }
  }, [address]);

  const fetchUserData = useCallback(async () => {
    if (!address) return;
    try {
      console.log("🔍 Fetching user profile for address:", address);
      const userProfile = await getUserProfile(address);
      console.log("📋 User profile data:", userProfile);

      // Check if userProfile exists and has transactionIds
      if (
        !userProfile ||
        !userProfile.transactionIds ||
        userProfile.transactionIds.length === 0
      ) {
        console.log("❌ No transactions found in user profile");
        setTransactions([]);
        return;
      }

      console.log("📦 Found transaction IDs:", userProfile.transactionIds);

      const userTransactions = await Promise.all(
        userProfile.transactionIds.map(async (id: string) => {
          try {
            console.log("🔄 Fetching details for transaction:", id);
            const details = await getTransactionDetails(id);
            console.log("✅ Transaction details fetched:", details);
            return {
              ...details,
              transactionId: id,
            };
          } catch (err) {
            console.error(`❌ Failed to fetch transaction ${id}:`, err);
            return null;
          }
        })
      );

      // Filter out null values (failed transactions) and reverse
      const validTransactions = userTransactions.filter((tx) => tx !== null);
      console.log("📊 Valid transactions for history:", validTransactions);
      setTransactions(validTransactions.reverse());
    } catch (err: unknown) {
      console.error("❌ Error fetching user data:", err);
      setTransactions([]);
    }
  }, [address]);

  const fetchUserId = useCallback(async () => {
    if (!address) return;
    try {
      const userId = (await getUserByAddress(address)) as string;
      if (userId && userId !== "") {
        setRegisteredUserId(userId);
      }
    } catch (err: unknown) {
      console.error("Error fetching userId:", err);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchPendingTransactions();
      fetchUserData();
      fetchUserId();
    }
  }, [address, fetchPendingTransactions, fetchUserData, fetchUserId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Main Header */}
      <MainHeader />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Safe P2P Payments
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Send crypto payments securely with built-in escrow protection.
            Support for ETH and ERC-20 tokens across multiple networks.
          </p>
        </div>

        {/* UserId Registration - if not registered */}
        {!registeredUserId && address && (
          <div className="mb-12">
            <RegisterUsername
              address={address}
              registeredUserId={registeredUserId}
              registerUserId={registerUserId}
              parseErrorMessage={parseErrorMessage}
              fetchUserId={fetchUserId}
            />
          </div>
        )}

        {/* Name Resolvers - ENS (Sepolia) and HNS (Hedera) */}
        <div className="mb-8 space-y-6">
          <EnsResolver
            copyToClipboard={copyToClipboard}
            onAddressResolved={(resolvedAddress, ensName) => {
              console.log(`ENS resolved: ${ensName} -> ${resolvedAddress}`);
              // You can add logic here to use the resolved address
              // For example, auto-fill it in the SendTransfer component
            }}
          />

          <HnsResolver
            copyToClipboard={copyToClipboard}
            onAddressResolved={(resolvedAddress, hnsName) => {
              console.log(`HNS resolved: ${hnsName} -> ${resolvedAddress}`);
              // You can add logic here to use the resolved address
              // For example, auto-fill it in the SendTransfer component
            }}
          />
        </div>

        {/* Two Column Layout - Send and Claim */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Send Transfer */}
          <SendTransfer
            address={address || undefined}
            sendToWalletAddress={sendToWalletAddress}
            sendToUserId={sendToUserId}
            getUserByUserId={getUserByUserId}
            parseErrorMessage={parseErrorMessage}
            copyToClipboard={copyToClipboard}
            fetchUserData={fetchUserData}
            fetchPendingTransactions={fetchPendingTransactions}
          />

          {/* Claim Transfer */}
          <ClaimTransfer
            address={address || undefined}
            claimTransactionById={claimTransactionById}
            getTransactionDetails={getTransactionDetails}
            parseErrorMessage={parseErrorMessage}
            fetchPendingTransactions={fetchPendingTransactions}
            fetchUserData={fetchUserData}
          />
        </div>

        {/* Transaction History */}
        <TransactionHistory
          address={address || undefined}
          balance={balance?.formatted || null}
          registeredUserId={registeredUserId}
          transactions={transactions}
          refundTransaction={refundTransaction}
          parseErrorMessage={parseErrorMessage}
          fetchUserData={fetchUserData}
          fetchPendingTransactions={fetchPendingTransactions}
          copyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  );
}

// Main export component
export default function SafeTransferPage() {
  return <SafeTransferContent />;
}
