import { isAddress } from 'viem';
import { RecipientFormData } from '../../types/bulk-transaction';

export const validateWalletAddress = (address: string): string | null => {
  if (!address) {
    return 'Wallet address is required';
  }
  if (!isAddress(address)) {
    return 'Invalid wallet address format';
  }
  return null;
};

export const validateRecipientForm = (data: RecipientFormData): string | null => {
  // Validate wallet address
  const addressError = validateWalletAddress(data.walletAddress);
  if (addressError) return addressError;

  // Validate full name
  if (!data.fullName || data.fullName.trim().length === 0) {
    return 'Full name is required';
  }
  if (data.fullName.length > 100) {
    return 'Full name must be less than 100 characters';
  }

  // Validate relation
  if (!data.relation || data.relation.trim().length === 0) {
    return 'Relation is required';
  }
  if (data.relation.length > 50) {
    return 'Relation must be less than 50 characters';
  }

  // Validate userId (optional)
  if (data.userId && data.userId.length > 50) {
    return 'User ID must be less than 50 characters';
  }

  return null;
};

export const validateAmount = (amount: string): string | null => {
  if (!amount || amount.trim().length === 0) {
    return 'Amount is required';
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return 'Invalid amount format';
  }

  if (numAmount <= 0) {
    return 'Amount must be greater than 0';
  }

  if (numAmount > 1000000) {
    return 'Amount exceeds maximum limit';
  }

  // Check decimal places (max 18)
  const decimals = amount.split('.')[1];
  if (decimals && decimals.length > 18) {
    return 'Too many decimal places (max 18)';
  }

  return null;
};

export const validateBulkTransfer = (
  recipientIds: number[],
  amounts: string[]
): string | null => {
  if (!recipientIds || recipientIds.length === 0) {
    return 'At least one recipient must be selected';
  }

  if (recipientIds.length !== amounts.length) {
    return 'Number of recipients and amounts must match';
  }

  if (recipientIds.length > 50) {
    return 'Maximum 50 recipients allowed per transaction';
  }

  // Validate each amount
  for (let i = 0; i < amounts.length; i++) {
    const error = validateAmount(amounts[i]);
    if (error) {
      return `Recipient ${i + 1}: ${error}`;
    }
  }

  return null;
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatAmount = (amount: string, decimals: number = 18): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  
  // Format with appropriate decimal places
  if (num < 0.01) {
    return num.toFixed(6);
  } else if (num < 1) {
    return num.toFixed(4);
  } else if (num < 1000) {
    return num.toFixed(2);
  } else {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
};
