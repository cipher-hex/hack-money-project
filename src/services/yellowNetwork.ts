import { createAppSessionMessage, parseRPCResponse } from "@erc7824/nitrolite";

// ====================================
// TYPES
// ====================================

export type MessageSigner = (payload: string) => Promise<`0x${string}`>;

export interface AppDefinition {
  protocol: string;
  participants: string[];
  weights: number[];
  quorum: number;
  challenge: number;
  nonce: number;
}

export interface AppAllocation {
  participant: string;
  asset: string;
  amount: string;
}

export interface AppSession {
  definition: AppDefinition;
  allocations: AppAllocation[];
}

export interface PaymentData {
  type: "payment";
  amount: string;
  recipient: string;
  sender: string;
  timestamp: number;
  signature?: string;
}

export interface ActivityLogEntry {
  id: string;
  type: "sent" | "received" | "session_created" | "connected" | "error";
  message: string;
  amount?: string;
  counterparty?: string;
  timestamp: number;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type YellowEventCallback = (event: {
  type: string;
  data: any;
}) => void;

// ====================================
// CONSTANTS
// ====================================

export const YELLOW_SANDBOX_WS = "wss://clearnet-sandbox.yellow.com/ws";
export const YELLOW_PRODUCTION_WS = "wss://clearnet.yellow.com/ws";
export const DEFAULT_PROTOCOL = "safewallet-pay-v1";

// ====================================
// YELLOW NETWORK SERVICE
// ====================================

export class YellowNetworkService {
  private ws: WebSocket | null = null;
  private messageSigner: MessageSigner | null = null;
  private userAddress: string | null = null;
  private _sessionId: string | null = null;
  private _connectionStatus: ConnectionStatus = "disconnected";
  private eventListeners: YellowEventCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private endpoint: string;

  constructor(endpoint: string = YELLOW_SANDBOX_WS) {
    this.endpoint = endpoint;
  }

  // ---- Getters ----

  get sessionId(): string | null {
    return this._sessionId;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  get isConnected(): boolean {
    return this._connectionStatus === "connected" && this.ws?.readyState === WebSocket.OPEN;
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

  // ---- Connection ----

  async connect(userAddress: string, messageSigner: MessageSigner): Promise<void> {
    this.userAddress = userAddress;
    this.messageSigner = messageSigner;
    this._connectionStatus = "connecting";
    this.emit("status_change", { status: "connecting" });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint);

        this.ws.onopen = () => {
          this._connectionStatus = "connected";
          this.reconnectAttempts = 0;
          this.emit("status_change", { status: "connected" });
          this.emit("activity", {
            type: "connected",
            message: "Connected to Yellow Network ClearNode",
            timestamp: Date.now(),
          });
          resolve();
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
          this._connectionStatus = "disconnected";
          this.emit("status_change", { status: "disconnected" });
          this.attemptReconnect();
        };
      } catch (error) {
        this._connectionStatus = "error";
        this.emit("status_change", { status: "error" });
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      !this.userAddress ||
      !this.messageSigner
    ) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      if (this.userAddress && this.messageSigner) {
        this.connect(this.userAddress, this.messageSigner).catch(() => {
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
    this._sessionId = null;
    this.emit("status_change", { status: "disconnected" });
  }

  // ---- Session Management ----

  async createSession(
    partnerAddress: string,
    myAmount: string = "1000000",
    partnerAmount: string = "0",
    asset: string = "usdc"
  ): Promise<void> {
    if (!this.ws || !this.messageSigner || !this.userAddress) {
      throw new Error("Not connected. Call connect() first.");
    }

    const appDefinition: AppDefinition = {
      protocol: DEFAULT_PROTOCOL,
      participants: [this.userAddress, partnerAddress],
      weights: [50, 50],
      quorum: 100,
      challenge: 0,
      nonce: Date.now(),
    };

    const allocations: AppAllocation[] = [
      {
        participant: this.userAddress,
        asset,
        amount: myAmount,
      },
      {
        participant: partnerAddress,
        asset,
        amount: partnerAmount,
      },
    ];

    const sessionMessage = await createAppSessionMessage(this.messageSigner, [
      { definition: appDefinition, allocations },
    ]);

    this.ws.send(sessionMessage);

    this.emit("activity", {
      type: "session_created",
      message: `Session request sent to ${partnerAddress.slice(0, 6)}...${partnerAddress.slice(-4)}`,
      counterparty: partnerAddress,
      timestamp: Date.now(),
    });
  }

  // ---- Payments ----

  async sendPayment(amount: string, recipient: string): Promise<void> {
    if (!this.ws || !this.messageSigner || !this.userAddress) {
      throw new Error("Not connected. Call connect() first.");
    }

    const paymentData: PaymentData = {
      type: "payment",
      amount,
      recipient,
      sender: this.userAddress,
      timestamp: Date.now(),
    };

    const signature = await this.messageSigner(JSON.stringify(paymentData));

    const signedPayment = {
      ...paymentData,
      signature,
    };

    this.ws.send(JSON.stringify(signedPayment));

    this.emit("activity", {
      type: "sent",
      message: `Sent ${amount} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      amount,
      counterparty: recipient,
      timestamp: Date.now(),
    });

    this.emit("payment_sent", {
      amount,
      recipient,
      timestamp: Date.now(),
    });
  }

  // ---- Message Handling ----

  private handleMessage(rawData: string) {
    try {
      const message = parseRPCResponse(rawData);

      if (message.error) {
        this.emit("activity", {
          type: "error",
          message: `Error: ${message.error.message || "Unknown error"}`,
          timestamp: Date.now(),
        });
        this.emit("rpc_error", message.error);
        return;
      }

      // Handle different message types based on method or result
      if (message.method) {
        switch (message.method) {
          case "session_created":
            this._sessionId = message.params?.sessionId || null;
            this.emit("activity", {
              type: "session_created",
              message: `Session confirmed: ${this._sessionId?.slice(0, 10)}...`,
              timestamp: Date.now(),
            });
            this.emit("session_created", {
              sessionId: this._sessionId,
            });
            break;

          case "payment":
            this.emit("activity", {
              type: "received",
              message: `Received ${message.params?.amount} from ${message.params?.sender?.slice(0, 6)}...${message.params?.sender?.slice(-4)}`,
              amount: message.params?.amount,
              counterparty: message.params?.sender,
              timestamp: Date.now(),
            });
            this.emit("payment_received", {
              amount: message.params?.amount,
              sender: message.params?.sender,
              timestamp: Date.now(),
            });
            break;

          case "session_message":
            this.emit("session_message", message.params);
            break;

          default:
            this.emit("message", message);
            break;
        }
      } else if (message.result) {
        // Handle RPC responses
        if (message.result.sessionId) {
          this._sessionId = message.result.sessionId;
          this.emit("session_created", { sessionId: this._sessionId });
          this.emit("activity", {
            type: "session_created",
            message: `Session confirmed: ${this._sessionId?.slice(0, 10)}...`,
            timestamp: Date.now(),
          });
        }
        this.emit("rpc_response", message);
      }
    } catch (error) {
      console.error("Failed to parse Yellow Network message:", error);
      this.emit("activity", {
        type: "error",
        message: "Failed to parse incoming message",
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
