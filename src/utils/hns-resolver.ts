// HNS (Hedera Name Service) Resolver utilities using REST API
// Resolves .hbar domain names to Hedera account IDs and EVM addresses

export interface HnsResolveResult {
  accountId: string;
  evmAddress: string;
}

/**
 * Resolves HNS domain name to Hedera account ID using HNS REST API
 * @param domain - The .hbar domain name (e.g., "hns.hbar")
 * @returns Promise<string | null> - Hedera account ID (e.g., "0.0.12345") or null if not found
 */
export async function resolveHnsName(domain: string): Promise<string | null> {
  // Validate domain format
  if (!domain.trim() || !domain.endsWith(".hbar")) {
    console.warn(
      `Invalid HNS domain format: ${domain}. Domain must end with .hbar`
    );
    return null;
  }

  const url = `https://api.hashgraph.name/api/v1/domains/resolve/${domain}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`HNS domain "${domain}" not found`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.accountId) {
      console.log(`HNS API resolved '${domain}' to: ${data.accountId}`);
      return data.accountId;
    } else {
      console.log("HNS API could not resolve the name.");
      return null;
    }
  } catch (err) {
    console.error("Error fetching from HNS API:", err);
    return null;
  }
}

/**
 * Gets EVM address from Hedera account ID using Mirror Node API
 * @param accountId - Hedera account ID (e.g., "0.0.12345")
 * @param chainId - Chain ID to determine which Mirror Node to use
 * @returns Promise<string | null> - EVM address (0x...) or null if not found
 */
export async function getEvmAddressFromAccountId(
  accountId: string,
  chainId: number
): Promise<string | null> {
  // Determine Mirror Node URL based on chain ID
  let mirrorNodeUrl: string;

  if (chainId === 296) {
    // Hedera testnet
    mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
  } else if (chainId === 295) {
    // Hedera mainnet (for future use)
    mirrorNodeUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
  } else {
    console.warn(`Unsupported chain ID for Hedera Mirror Node: ${chainId}`);
    return null;
  }

  try {
    const response = await fetch(mirrorNodeUrl);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Hedera account "${accountId}" not found`);
        return null;
      }
      throw new Error(`Mirror Node HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.evm_address) {
      console.log(
        `Mirror Node resolved account '${accountId}' to EVM address: ${data.evm_address}`
      );
      return data.evm_address;
    } else {
      console.log(
        `Account "${accountId}" does not have an associated EVM address`
      );
      return null;
    }
  } catch (err) {
    console.error("Error fetching from Hedera Mirror Node API:", err);
    return null;
  }
}

/**
 * Resolves HNS domain to both account ID and EVM address
 * @param domain - The .hbar domain name (e.g., "hns.hbar")
 * @param chainId - Chain ID to determine Mirror Node endpoint
 * @returns Promise<HnsResolveResult | null> - Object with accountId and evmAddress or null
 */
export async function resolveHnsToAccountIdAndAddress(
  domain: string,
  chainId: number
): Promise<HnsResolveResult | null> {
  try {
    // Step 1: Resolve domain to account ID
    const accountId = await resolveHnsName(domain);
    if (!accountId) {
      return null;
    }

    // Step 2: Get EVM address from account ID
    const evmAddress = await getEvmAddressFromAccountId(accountId, chainId);
    if (!evmAddress) {
      console.warn(`Could not get EVM address for account ${accountId}`);
      return null;
    }

    return {
      accountId,
      evmAddress,
    };
  } catch (error) {
    console.error("Error in resolveHnsToAccountIdAndAddress:", error);
    return null;
  }
}

/**
 * Validates if a string is a valid .hbar domain format
 * @param domain - Domain string to validate
 * @returns boolean - True if valid .hbar domain format
 */
export function isValidHbarDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") {
    return false;
  }

  const trimmed = domain.trim();

  // Must end with .hbar
  if (!trimmed.endsWith(".hbar")) {
    return false;
  }

  // Must have content before .hbar
  const name = trimmed.substring(0, trimmed.length - 5); // Remove .hbar
  if (name.length === 0) {
    return false;
  }

  // Basic validation - no spaces, special characters (can be expanded)
  const validNameRegex = /^[a-zA-Z0-9-_.]+$/;
  return validNameRegex.test(name);
}
