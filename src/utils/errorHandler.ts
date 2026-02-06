/**
 * Convert raw blockchain error messages to user-friendly messages
 */
export function parseErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred";

  const errorMessage =
    typeof error === "string"
      ? error
      : error.message || error.reason || error.toString();

  // Convert to lowercase for easier matching
  const lowerMessage = errorMessage.toLowerCase();

  // Username Registration Errors
  if (lowerMessage.includes("username cannot be empty")) {
    return "Please enter a username";
  }
  if (lowerMessage.includes("user already registered")) {
    return "You already have a registered username";
  }
  if (lowerMessage.includes("username already taken")) {
    return "This username is already taken";
  }

  // Transfer Initiation Errors
  if (lowerMessage.includes("amount must be greater than 0")) {
    return "Amount must be greater than 0";
  }
  if (lowerMessage.includes("invalid recipient address")) {
    return "Invalid recipient address";
  }
  if (lowerMessage.includes("username not found")) {
    return "Username not found";
  }
  if (
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("insufficient balance") ||
    lowerMessage.includes("not enough")
  ) {
    return "Insufficient balance to complete transfer";
  }

  // Claim Transfer Errors
  if (lowerMessage.includes("you are not the intended recipient")) {
    return "You are not authorized to claim this transfer";
  }
  if (lowerMessage.includes("transfer is not claimable")) {
    return "This transfer has already been claimed or refunded";
  }
  if (lowerMessage.includes("sender username not found")) {
    return "Sender username not found";
  }
  if (lowerMessage.includes("no pending transfer found")) {
    return "No pending transfer found from this sender";
  }

  // Refund Transfer Errors
  if (lowerMessage.includes("you are not the sender")) {
    return "You can only refund transfers you sent";
  }
  if (lowerMessage.includes("transfer is not refundable")) {
    return "This transfer has already been claimed or refunded";
  }

  // Network/Connection Errors
  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied")
  ) {
    return "Transaction was cancelled by user";
  }
  if (
    lowerMessage.includes("network error") ||
    lowerMessage.includes("connection failed")
  ) {
    return "Network connection failed. Please try again";
  }
  if (lowerMessage.includes("gas")) {
    return "Transaction failed due to gas issues. Please try again";
  }
  if (lowerMessage.includes("nonce")) {
    return "Transaction nonce error. Please refresh and try again";
  }

  // Wallet Connection Errors
  if (
    lowerMessage.includes("no provider") ||
    lowerMessage.includes("wallet not connected")
  ) {
    return "Please connect your wallet first";
  }
  if (
    lowerMessage.includes("unsupported chain") ||
    lowerMessage.includes("wrong network")
  ) {
    return "This smart contract is not deployed on the current chain. Please switch to a supported network to continue.";
  }

  // Generic blockchain errors
  if (
    lowerMessage.includes("revert") ||
    lowerMessage.includes("execution reverted")
  ) {
    return "Transaction failed. Please check your inputs and try again";
  }
  if (lowerMessage.includes("timeout")) {
    return "Transaction timed out. Please try again";
  }

  // If no specific error is matched, return a generic message
  return "Transaction failed. Please check your inputs and try again";
}

/**
 * Check if an error is user-actionable (not a system error)
 */
export function isUserActionableError(error: any): boolean {
  const errorMessage =
    typeof error === "string"
      ? error
      : error.message || error.reason || error.toString();
  const lowerMessage = errorMessage.toLowerCase();

  // These are system errors that users can't fix
  const systemErrors = [
    "network error",
    "connection failed",
    "gas",
    "nonce",
    "timeout",
    "revert",
  ];

  return !systemErrors.some((sysError) => lowerMessage.includes(sysError));
}
