export interface Recipient {
  id?: number;
  walletAddress: string;
  relation: string;
  fullName: string;
  userId?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface BulkTransaction {
  sender: string;
  tokenAddress: string;
  totalAmount: string;
  recipientCount: number;
  timestamp: number;
  isNative: boolean;
}

export interface BulkTransferData {
  recipientIds: number[];
  amounts: string[];
  tokenAddress?: string;
  isNative: boolean;
}

export interface RecipientFormData {
  walletAddress: string;
  relation: string;
  fullName: string;
  userId?: string;
}

export interface BulkTransactionState {
  recipients: Recipient[];
  selectedRecipients: number[];
  transactionHistory: BulkTransaction[];
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface RecipientWithAmount extends Recipient {
  amount: string;
}

export interface BulkTransferFormData {
  recipients: RecipientWithAmount[];
  tokenAddress?: string;
  isNative: boolean;
  totalAmount: string;
}
