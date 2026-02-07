import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  YellowNetworkService,
  YELLOW_SANDBOX_WS,
  type ConnectionStatus,
  type ActivityLogEntry,
} from "../services/yellowNetwork";

// ====================================
// CONTEXT TYPES
// ====================================

interface YellowContextState {
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  activityLog: ActivityLogEntry[];
  error: string | null;
  connect: (userAddress: string) => Promise<void>;
  disconnect: () => void;
  createSession: (
    partnerAddress: string,
    myAmount?: string,
    partnerAmount?: string,
    asset?: string
  ) => Promise<void>;
  sendPayment: (amount: string, recipient: string) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  // Initialize service once
  useEffect(() => {
    serviceRef.current = new YellowNetworkService(YELLOW_SANDBOX_WS);

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
          setError(event.data.message || "Unknown error from ClearNode");
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

  const connect = useCallback(async (userAddress: string) => {
    if (!serviceRef.current) return;
    setError(null);

    try {
      // Create a message signer using window.ethereum (MetaMask / Web3Auth injected provider)
      const messageSigner = async (message: string): Promise<`0x${string}`> => {
        if (!window.ethereum) {
          throw new Error("No Ethereum provider found");
        }
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, userAddress],
        });
        return signature as `0x${string}`;
      };

      await serviceRef.current.connect(userAddress, messageSigner);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect to Yellow Network";
      setError(msg);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
    setSessionId(null);
    setError(null);
  }, []);

  const createSession = useCallback(
    async (
      partnerAddress: string,
      myAmount?: string,
      partnerAmount?: string,
      asset?: string
    ) => {
      if (!serviceRef.current) return;
      setError(null);

      try {
        await serviceRef.current.createSession(
          partnerAddress,
          myAmount,
          partnerAmount,
          asset
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to create session";
        setError(msg);
        throw err;
      }
    },
    []
  );

  const sendPayment = useCallback(
    async (amount: string, recipient: string) => {
      if (!serviceRef.current) return;
      setError(null);

      try {
        await serviceRef.current.sendPayment(amount, recipient);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to send payment";
        setError(msg);
        throw err;
      }
    },
    []
  );

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  return (
    <YellowContext.Provider
      value={{
        connectionStatus,
        sessionId,
        activityLog,
        error,
        connect,
        disconnect,
        createSession,
        sendPayment,
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
