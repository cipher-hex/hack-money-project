import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { WalletClient } from "viem";
import {
  YellowNetworkService,
  YELLOW_PRODUCTION_WS,
  type ConnectionStatus,
  type ActivityLogEntry,
} from "../services/yellowNetwork";

export interface OffChainBalance {
  asset: string;
  amount: string;
}

// ====================================
// CONTEXT TYPES
// ====================================

interface YellowContextState {
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  activityLog: ActivityLogEntry[];
  offChainBalances: OffChainBalance[];
  error: string | null;
  connect: (
    userAddress: `0x${string}`,
    walletClient: WalletClient,
  ) => Promise<void>;
  disconnect: () => void;
  createSession: (
    partnerAddress: `0x${string}`,
    myAmount?: string,
    partnerAmount?: string,
    asset?: string,
  ) => Promise<void>;
  sendPayment: (
    amount: string,
    recipient: `0x${string}`,
    asset?: string,
  ) => Promise<void>;
  refreshBalances: () => Promise<void>;
  clearActivityLog: () => void;
}

// ====================================
// CONTEXT
// ====================================

const YellowContext = createContext<YellowContextState | null>(null);

// ====================================
// PROVIDER
// ====================================

export const YellowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const serviceRef = useRef<YellowNetworkService | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [offChainBalances, setOffChainBalances] = useState<OffChainBalance[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  // Initialize service once
  useEffect(() => {
    serviceRef.current = new YellowNetworkService(YELLOW_PRODUCTION_WS);

    const unsubscribe = serviceRef.current.addEventListener((event) => {
      switch (event.type) {
        case "status_change":
          setConnectionStatus(event.data.status);
          break;

        case "session_created":
          setSessionId(event.data.sessionId);
          break;

        case "activity":
          setActivityLog((prev) => [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: event.data.type,
              message: event.data.message,
              amount: event.data.amount,
              counterparty: event.data.counterparty,
              timestamp: event.data.timestamp,
            },
            ...prev,
          ]);
          break;

        case "rpc_error":
          setError(event.data.error || "Unknown error from ClearNode");
          break;

        case "ledger_balances":
          setOffChainBalances(event.data.balances || []);
          break;

        case "payment_received":
          // Could trigger a toast notification here
          break;
      }
    });

    return () => {
      unsubscribe();
      serviceRef.current?.destroy();
    };
  }, []);

  // ---- Actions ----

  const connect = useCallback(
    async (userAddress: `0x${string}`, walletClient: WalletClient) => {
      if (!serviceRef.current) return;
      setError(null);

      try {
        await serviceRef.current.connect(userAddress, walletClient);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to connect to Yellow Network";
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
    setSessionId(null);
    setError(null);
  }, []);

  const createSession = useCallback(
    async (
      partnerAddress: `0x${string}`,
      myAmount?: string,
      partnerAmount?: string,
      asset?: string,
    ) => {
      if (!serviceRef.current) return;
      setError(null);

      try {
        await serviceRef.current.createSession(
          partnerAddress,
          myAmount,
          partnerAmount,
          asset,
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to create session";
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const sendPayment = useCallback(
    async (amount: string, recipient: `0x${string}`, asset?: string) => {
      if (!serviceRef.current) return;
      setError(null);

      try {
        await serviceRef.current.sendPayment(amount, recipient, asset);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to send payment";
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const refreshBalances = useCallback(async () => {
    if (!serviceRef.current) return;
    try {
      await serviceRef.current.fetchLedgerBalances();
    } catch (err) {
      console.error("Failed to refresh balances:", err);
    }
  }, []);

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  return (
    <YellowContext.Provider
      value={{
        connectionStatus,
        sessionId,
        activityLog,
        offChainBalances,
        error,
        connect,
        disconnect,
        createSession,
        sendPayment,
        refreshBalances,
        clearActivityLog,
      }}
    >
      {children}
    </YellowContext.Provider>
  );
};

// ====================================
// HOOK
// ====================================

export function useYellow(): YellowContextState {
  const context = useContext(YellowContext);
  if (!context) {
    throw new Error("useYellow must be used within a YellowProvider");
  }
  return context;
}
