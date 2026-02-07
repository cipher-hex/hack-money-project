import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import MainHeader from "../components/shared/MainHeader";
import { useYellow } from "../context/YellowContext";
import type { ConnectionStatus, ActivityLogEntry } from "../services/yellowNetwork";

// ====================================
// SUB-COMPONENTS
// ====================================

const ConnectionStatusBadge: React.FC<{ status: ConnectionStatus }> = ({
  status,
}) => {
  const config: Record<
    ConnectionStatus,
    { color: string; bg: string; label: string; dot: string }
  > = {
    disconnected: {
      color: "text-gray-600",
      bg: "bg-gray-100 border-gray-200",
      label: "Disconnected",
      dot: "bg-gray-400",
    },
    connecting: {
      color: "text-yellow-700",
      bg: "bg-yellow-50 border-yellow-200",
      label: "Connecting...",
      dot: "bg-yellow-400 animate-pulse",
    },
    connected: {
      color: "text-green-700",
      bg: "bg-green-50 border-green-200",
      label: "Connected",
      dot: "bg-green-500",
    },
    error: {
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      label: "Error",
      dot: "bg-red-500",
    },
  };

  const c = config[status];

  return (
    <span
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.color}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span>{c.label}</span>
    </span>
  );
};

// ---- Connect Section ----

const ConnectSection: React.FC<{
  walletAddress: string | undefined;
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}> = ({ walletAddress, connectionStatus, onConnect, onDisconnect }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          ClearNode Connection
        </h2>
        <ConnectionStatusBadge status={connectionStatus} />
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Connect to Yellow Network's ClearNode to enable instant off-chain
        payments via state channels.
      </p>

      {!walletAddress ? (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          Please connect your wallet first using the header button.
        </p>
      ) : connectionStatus === "connected" ? (
        <button
          onClick={onDisconnect}
          className="w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
        >
          Disconnect from ClearNode
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={connectionStatus === "connecting"}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectionStatus === "connecting"
            ? "Connecting..."
            : "Connect to ClearNode"}
        </button>
      )}
    </div>
  );
};

// ---- Session Section ----

const SessionSection: React.FC<{
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  onCreateSession: (
    partner: string,
    myAmount: string,
    partnerAmount: string,
    asset: string
  ) => void;
}> = ({ connectionStatus, sessionId, onCreateSession }) => {
  const [partnerAddress, setPartnerAddress] = useState("");
  const [myAmount, setMyAmount] = useState("1000000");
  const [partnerAmount, setPartnerAmount] = useState("0");
  const [asset, setAsset] = useState("usdc");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleCreate = async () => {
    if (!partnerAddress) {
      setLocalError("Please enter a counterparty address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(partnerAddress)) {
      setLocalError("Invalid Ethereum address format.");
      return;
    }
    setLocalError("");
    setLoading(true);
    try {
      await onCreateSession(partnerAddress, myAmount, partnerAmount, asset);
    } catch {
      setLocalError("Failed to create session. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = connectionStatus !== "connected";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Payment Session
      </h2>

      {sessionId ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-green-800">
            Session Active
          </p>
          <p className="text-xs text-green-600 font-mono mt-1 break-all">
            {sessionId}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          Create a payment session with a counterparty to start sending instant
          payments.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Counterparty Address
          </label>
          <input
            type="text"
            value={partnerAddress}
            onChange={(e) => setPartnerAddress(e.target.value)}
            placeholder="0x..."
            disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Allocation
            </label>
            <input
              type="text"
              value={myAmount}
              onChange={(e) => setMyAmount(e.target.value)}
              placeholder="Amount in smallest unit"
              disabled={isDisabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Partner Allocation
            </label>
            <input
              type="text"
              value={partnerAmount}
              onChange={(e) => setPartnerAmount(e.target.value)}
              placeholder="Amount in smallest unit"
              disabled={isDisabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset
          </label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="usdc">USDC</option>
            <option value="usdt">USDT</option>
            <option value="eth">ETH</option>
          </select>
        </div>

        {localError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {localError}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={isDisabled || loading}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Session..." : "Create Payment Session"}
        </button>
      </div>
    </div>
  );
};

// ---- Send Payment Section ----

const SendPaymentSection: React.FC<{
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  onSendPayment: (amount: string, recipient: string) => void;
}> = ({ connectionStatus, sessionId, onSendPayment }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!recipient) {
      setLocalError("Please enter a recipient address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setLocalError("Invalid Ethereum address format.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setLocalError("Please enter a valid amount.");
      return;
    }
    setLocalError("");
    setSuccess(false);
    setLoading(true);
    try {
      await onSendPayment(amount, recipient);
      setSuccess(true);
      setAmount("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setLocalError("Failed to send payment. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    connectionStatus !== "connected" || !sessionId;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Send Instant Payment
      </h2>

      {!sessionId && connectionStatus === "connected" && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          Create a payment session first to start sending payments.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (smallest unit, e.g. 100000 = 0.1 USDC)
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100000"
            disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {localError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {localError}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
            Payment sent instantly!
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={isDisabled || loading}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Payment"}
        </button>
      </div>
    </div>
  );
};

// ---- Activity Log Section ----

const ActivityLogSection: React.FC<{
  activityLog: ActivityLogEntry[];
  onClear: () => void;
}> = ({ activityLog, onClear }) => {
  const typeConfig: Record<
    string,
    { icon: string; color: string }
  > = {
    sent: { icon: "↑", color: "text-red-600 bg-red-100" },
    received: { icon: "↓", color: "text-green-600 bg-green-100" },
    session_created: { icon: "⚡", color: "text-blue-600 bg-blue-100" },
    connected: { icon: "🟢", color: "text-green-600 bg-green-100" },
    error: { icon: "✕", color: "text-red-600 bg-red-100" },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
        {activityLog.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No activity yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Connect and create a session to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activityLog.map((entry) => {
            const cfg = typeConfig[entry.type] || {
              icon: "•",
              color: "text-gray-600 bg-gray-100",
            };
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${cfg.color}`}
                >
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{entry.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ====================================
// MAIN PAGE COMPONENT
// ====================================

const UniversalPaymentPage: React.FC = () => {
  const { address } = useAccount();
  const {
    connectionStatus,
    sessionId,
    activityLog,
    error,
    connect,
    disconnect,
    createSession,
    sendPayment,
    clearActivityLog,
  } = useYellow();

  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (error) setPageError(error);
  }, [error]);

  const handleConnect = async () => {
    if (!address) return;
    setPageError(null);
    try {
      await connect(address);
    } catch (err: unknown) {
      setPageError(
        err instanceof Error ? err.message : "Connection failed"
      );
    }
  };

  const handleCreateSession = async (
    partner: string,
    myAmount: string,
    partnerAmount: string,
    asset: string
  ) => {
    setPageError(null);
    await createSession(partner, myAmount, partnerAmount, asset);
  };

  const handleSendPayment = async (amount: string, recipient: string) => {
    setPageError(null);
    await sendPayment(amount, recipient);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <MainHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent mb-4">
            Universal Payment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Instant cross-chain payments powered by Yellow Network state
            channels. Send funds from any chain — receiver claims in their
            preferred token.
          </p>
        </div>

        {/* Global Error */}
        {pageError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* How It Works */}
        <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Connect",
                desc: "Connect your wallet and join the Yellow Network ClearNode.",
              },
              {
                step: "2",
                title: "Create Session",
                desc: "Open a state channel with a counterparty and allocate funds.",
              },
              {
                step: "3",
                title: "Send Instantly",
                desc: "Send payments off-chain with zero gas fees and instant finality.",
              },
              {
                step: "4",
                title: "Withdraw",
                desc: "Close the channel and withdraw funds to any supported chain.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-amber-50 border border-amber-100"
              >
                <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold mb-2">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-gray-800">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <ConnectSection
              walletAddress={address}
              connectionStatus={connectionStatus}
              onConnect={handleConnect}
              onDisconnect={disconnect}
            />

            <SessionSection
              connectionStatus={connectionStatus}
              sessionId={sessionId}
              onCreateSession={handleCreateSession}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <SendPaymentSection
              connectionStatus={connectionStatus}
              sessionId={sessionId}
              onSendPayment={handleSendPayment}
            />

            <ActivityLogSection
              activityLog={activityLog}
              onClear={clearActivityLog}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalPaymentPage;
