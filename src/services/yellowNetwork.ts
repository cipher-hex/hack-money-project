import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  createAppSessionMessage,
  createTransferMessage,
  createGetLedgerBalancesMessage,
  parseAnyRPCResponse,
  RPCMethod,
  RPCProtocolVersion,
  type MessageSigner,
  type RPCResponse,
} from "@erc7824/nitrolite";
import type { WalletClient } from "viem";

// ====================================
// TYPES
// ====================================

export type { MessageSigner };

export interface ActivityLogEntry {
  id: string;
  type:
    | "sent"
    | "received"
    | "session_created"
    | "connected"
    | "authenticated"
    | "error"
    | "info";
  message: string;
  amount?: string;
  counterparty?: string;
  timestamp: number;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticating"
  | "authenticated"
  | "error";

export type YellowEventCallback = (event: { type: string; data: any }) => void;

// ====================================
// CONSTANTS
// ====================================

export const YELLOW_SANDBOX_WS = "wss://clearnet-sandbox.yellow.com/ws";
export const YELLOW_PRODUCTION_WS = "wss://clearnet.yellow.com/ws";
export const DEFAULT_APP_NAME = "SafeWalletPay";

// ====================================
// YELLOW NETWORK SERVICE
// ====================================

export class YellowNetworkService {
  private ws: WebSocket | null = null;
  private messageSigner: MessageSigner | null = null;
  private walletClient: WalletClient | null = null;
  private userAddress: `0x${string}` | null = null;
  private _sessionId: string | null = null;
  private _connectionStatus: ConnectionStatus = "disconnected";
  private _isAuthenticated = false;
  private eventListeners: YellowEventCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private endpoint: string;
  private jwtToken: string | null = null;
  private authResolve: (() => void) | null = null;
  private authReject: ((err: Error) => void) | null = null;

  constructor(endpoint: string = YELLOW_PRODUCTION_WS) {
    this.endpoint = endpoint;
    // Restore JWT from storage if available
    this.jwtToken = localStorage.getItem("yellow_jwt_token");
  }

  // ---- Getters ----

  get sessionId(): string | null {
    return this._sessionId;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  // ---- Event System ----

  addEventListener(callback: YellowEventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((cb) => cb !== callback);
    };
  }

  private emit(type: string, data: any) {
    this.eventListeners.forEach((cb) => cb({ type, data }));
  }

  // ---- Connection & Authentication ----

  async connect(
    userAddress: `0x${string}`,
    walletClient: WalletClient,
  ): Promise<void> {
    this.userAddress = userAddress;
    this.walletClient = walletClient;
    this._connectionStatus = "connecting";
    this._isAuthenticated = false;
    this.emit("status_change", { status: "connecting" });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint);

        this.ws.onopen = async () => {
          this._connectionStatus = "connected";
          this.reconnectAttempts = 0;
          this.emit("status_change", { status: "connected" });
          this.emit("activity", {
            type: "connected",
            message: "WebSocket connected to ClearNode",
            timestamp: Date.now(),
          });

          // Start authentication flow
          try {
            this._connectionStatus = "authenticating";
            this.emit("status_change", { status: "authenticating" });

            // Store resolve/reject so the message handler can complete the auth flow
            this.authResolve = resolve;
            this.authReject = reject;

            await this.sendAuthRequest();
          } catch (authError) {
            this._connectionStatus = "error";
            this.emit("status_change", { status: "error" });
            reject(authError);
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error: Event) => {
          console.error("Yellow Network WebSocket error:", error);
          this._connectionStatus = "error";
          this.emit("status_change", { status: "error" });
          this.emit("activity", {
            type: "error",
            message: "WebSocket connection error",
            timestamp: Date.now(),
          });
          reject(new Error("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          const wasAuthenticated = this._isAuthenticated;
          this._connectionStatus = "disconnected";
          this._isAuthenticated = false;
          this.emit("status_change", { status: "disconnected" });
          if (wasAuthenticated) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this._connectionStatus = "error";
        this.emit("status_change", { status: "error" });
        reject(error);
      }
    });
  }

  private async sendAuthRequest(): Promise<void> {
    if (!this.ws || !this.userAddress) {
      throw new Error("WebSocket not connected or no user address");
    }

    const authRequestMsg = await createAuthRequestMessage({
      address: this.userAddress,
      session_key: this.userAddress, // Using wallet address as session key for simplicity
      application: DEFAULT_APP_NAME,
      expires_at: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
      scope: "console",
      allowances: [],
    });

    this.ws.send(authRequestMsg);

    this.emit("activity", {
      type: "info",
      message: "Authentication request sent...",
      timestamp: Date.now(),
    });
  }

  private async handleAuthChallenge(message: RPCResponse): Promise<void> {
    if (!this.ws || !this.walletClient || !this.userAddress) {
      throw new Error("Missing wallet client or address for auth");
    }

    const params = (message as any).params;
    const challengeMessage =
      params?.challengeMessage || params?.challenge_message;

    if (!challengeMessage) {
      console.error(
        "No challenge message in auth_challenge response:",
        message,
      );
      throw new Error("Invalid auth challenge: no challenge message");
    }

    this.emit("activity", {
      type: "info",
      message: "Signing authentication challenge...",
      timestamp: Date.now(),
    });

    // Create EIP-712 message signer
    const eip712Signer = createEIP712AuthMessageSigner(
      this.walletClient,
      {
        scope: "console",
        session_key: this.userAddress,
        expires_at: BigInt(Math.floor(Date.now() / 1000) + 3600),
        allowances: [],
      },
      {
        name: DEFAULT_APP_NAME,
      },
    );

    // Create and send auth_verify with signed challenge
    const authVerifyMsg = await createAuthVerifyMessage(
      eip712Signer,
      message as any,
    );

    this.ws.send(authVerifyMsg);
  }

  private handleAuthVerify(message: RPCResponse): void {
    const params = (message as any).params;

    if (params?.success) {
      this._isAuthenticated = true;
      this._connectionStatus = "authenticated";

      // Store JWT for reconnection
      if (params.jwtToken) {
        this.jwtToken = params.jwtToken;
        localStorage.setItem("yellow_jwt_token", params.jwtToken);
      }

      this.emit("status_change", { status: "authenticated" });
      this.emit("activity", {
        type: "authenticated",
        message: "Successfully authenticated with ClearNode",
        timestamp: Date.now(),
      });

      // Fetch initial ledger balances after auth
      this.fetchLedgerBalances().catch((err) =>
        console.error("Failed to fetch initial balances:", err),
      );

      // Resolve the connect() promise
      if (this.authResolve) {
        this.authResolve();
        this.authResolve = null;
        this.authReject = null;
      }
    } else {
      this._connectionStatus = "error";
      this.emit("status_change", { status: "error" });
      this.emit("activity", {
        type: "error",
        message: "Authentication failed",
        timestamp: Date.now(),
      });

      if (this.authReject) {
        this.authReject(new Error("Authentication failed"));
        this.authResolve = null;
        this.authReject = null;
      }
    }
  }

  private attemptReconnect() {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      !this.userAddress ||
      !this.walletClient
    ) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      if (this.userAddress && this.walletClient) {
        this.connect(this.userAddress, this.walletClient).catch(() => {
          // Reconnect failed, will try again via onclose
        });
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.maxReconnectAttempts = 0; // Prevent reconnection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connectionStatus = "disconnected";
    this._isAuthenticated = false;
    this._sessionId = null;
    this.messageSigner = null;
    this.authResolve = null;
    this.authReject = null;
    this.emit("status_change", { status: "disconnected" });
  }

  // ---- Balance ----

  async fetchLedgerBalances(): Promise<void> {
    if (!this.ws || !this._isAuthenticated || !this.userAddress) {
      throw new Error("Not authenticated. Call connect() first.");
    }

    const signer = this.getMessageSigner();
    const msg = await createGetLedgerBalancesMessage(signer, this.userAddress);
    this.ws.send(msg);
  }

  // ---- Session Management ----

  async createSession(
    partnerAddress: `0x${string}`,
    myAmount: string = "1000000",
    partnerAmount: string = "0",
    asset: string = "usdc",
  ): Promise<void> {
    if (!this.ws || !this.userAddress || !this._isAuthenticated) {
      throw new Error("Not authenticated. Call connect() first.");
    }

    // Create a message signer using the wallet client
    const signer = this.getMessageSigner();

    const appDefinition = {
      protocol: RPCProtocolVersion.NitroRPC_0_2,
      application: DEFAULT_APP_NAME,
      participants: [this.userAddress, partnerAddress] as `0x${string}`[],
      weights: [100, 0],
      quorum: 100,
      challenge: 0,
      nonce: Date.now(),
    };

    const allocations = [
      {
        participant: this.userAddress as `0x${string}`,
        asset,
        amount: myAmount,
      },
      {
        participant: partnerAddress as `0x${string}`,
        asset,
        amount: partnerAmount,
      },
    ];

    const sessionMessage = await createAppSessionMessage(signer, {
      definition: appDefinition,
      allocations,
    });

    this.ws.send(sessionMessage);

    this.emit("activity", {
      type: "info",
      message: `Session request sent to ${partnerAddress.slice(0, 6)}...${partnerAddress.slice(-4)}`,
      counterparty: partnerAddress,
      timestamp: Date.now(),
    });
  }

  // ---- Payments (Transfer) ----

  async sendPayment(
    amount: string,
    recipient: `0x${string}`,
    asset: string = "usdc",
  ): Promise<void> {
    if (!this.ws || !this.userAddress || !this._isAuthenticated) {
      throw new Error("Not authenticated. Call connect() first.");
    }

    const signer = this.getMessageSigner();

    const transferMsg = await createTransferMessage(signer, {
      destination: recipient,
      allocations: [
        {
          asset,
          amount,
        },
      ],
    });

    this.ws.send(transferMsg);

    this.emit("activity", {
      type: "sent",
      message: `Transfer of ${amount} ${asset} sent to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      amount,
      counterparty: recipient,
      timestamp: Date.now(),
    });

    this.emit("payment_sent", {
      amount,
      recipient,
      asset,
      timestamp: Date.now(),
    });
  }

  // ---- Message Signer Helper ----

  private getMessageSigner(): MessageSigner {
    if (!this.walletClient || !this.userAddress) {
      throw new Error("Wallet client not available");
    }

    const walletClient = this.walletClient;
    const userAddress = this.userAddress;

    // MessageSigner type: (payload: RPCData) => Promise<Hex>
    // RPCData = [RequestID, RPCMethod, object, Timestamp?]
    const signer: MessageSigner = async (payload) => {
      const message = JSON.stringify(payload);
      const signature = await walletClient.signMessage({
        account: userAddress,
        message,
      });
      return signature;
    };

    return signer;
  }

  // ---- Message Handling ----

  private handleMessage(rawData: string) {
    try {
      const message = parseAnyRPCResponse(rawData);

      switch (message.method) {
        // ---- Auth Flow ----
        case RPCMethod.AuthChallenge:
          this.handleAuthChallenge(message).catch((err) => {
            console.error("Auth challenge handling failed:", err);
            this.emit("activity", {
              type: "error",
              message: `Auth challenge failed: ${err.message}`,
              timestamp: Date.now(),
            });
            if (this.authReject) {
              this.authReject(err);
              this.authResolve = null;
              this.authReject = null;
            }
          });
          break;

        case RPCMethod.AuthVerify:
          this.handleAuthVerify(message);
          break;

        // ---- Error ----
        case RPCMethod.Error: {
          const errorParams = (message as any).params;
          const errorMsg = errorParams?.error || "Unknown ClearNode error";
          this.emit("activity", {
            type: "error",
            message: `ClearNode error: ${errorMsg}`,
            timestamp: Date.now(),
          });
          this.emit("rpc_error", { error: errorMsg });
          break;
        }

        // ---- Session ----
        case RPCMethod.CreateAppSession: {
          const sessionParams = (message as any).params;
          this._sessionId = sessionParams?.appSessionId || null;
          this.emit("activity", {
            type: "session_created",
            message: `Session created: ${this._sessionId ? this._sessionId.slice(0, 16) + "..." : "unknown"}`,
            timestamp: Date.now(),
          });
          this.emit("session_created", {
            sessionId: this._sessionId,
            status: sessionParams?.status,
          });
          break;
        }

        // ---- Transfer ----
        case RPCMethod.Transfer: {
          const transferParams = (message as any).params;
          this.emit("activity", {
            type: "sent",
            message: `Transfer confirmed`,
            timestamp: Date.now(),
          });
          this.emit("transfer_confirmed", transferParams);
          break;
        }

        // ---- Transfer Notification (incoming) ----
        case RPCMethod.TransferNotification: {
          const trParams = (message as any).params;
          const transactions = trParams?.transactions || [];
          for (const tx of transactions) {
            this.emit("activity", {
              type: "received",
              message: `Received ${tx.amount} ${tx.asset} from ${tx.fromAccount?.slice(0, 6)}...${tx.fromAccount?.slice(-4)}`,
              amount: tx.amount,
              counterparty: tx.fromAccount,
              timestamp: Date.now(),
            });
          }
          this.emit("payment_received", { transactions });
          break;
        }

        // ---- Ledger Balances Response ----
        case RPCMethod.GetLedgerBalances: {
          const ledgerParams = (message as any).params;
          const balances = ledgerParams?.ledgerBalances || [];
          this.emit("ledger_balances", { balances });
          break;
        }

        // ---- Balance Update (push) ----
        case RPCMethod.BalanceUpdate: {
          const balanceParams = (message as any).params;
          const updatedBalances = balanceParams?.balanceUpdates || [];
          this.emit("ledger_balances", { balances: updatedBalances });
          this.emit("activity", {
            type: "info",
            message: "Balance updated",
            timestamp: Date.now(),
          });
          break;
        }

        // ---- Ping/Pong ----
        case RPCMethod.Ping:
          // Auto-respond to pings to keep connection alive
          // The SDK doesn't have a createPongMessage, so we just log it
          break;

        // ---- Default ----
        default:
          this.emit("message", message);
          break;
      }
    } catch (error) {
      console.error(
        "Failed to parse Yellow Network message:",
        error,
        "Raw:",
        rawData,
      );
      this.emit("activity", {
        type: "error",
        message: `Failed to parse message: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
    }
  }

  // ---- Cleanup ----

  destroy() {
    this.disconnect();
    this.eventListeners = [];
  }
}
