const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// File path for contract addresses
const CONTRACT_ADDRESSES_FILE = path.join(
  __dirname,
  "..",
  "contract-address",
  "safePay-address.json"
);

// Function to load existing contract addresses
function loadExistingAddresses() {
  try {
    if (fs.existsSync(CONTRACT_ADDRESSES_FILE)) {
      const data = fs.readFileSync(CONTRACT_ADDRESSES_FILE, "utf8");
      const parsed = JSON.parse(data);
      // Ensure backward compatibility
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    }
  } catch (error) {
    console.warn("Warning: Could not load existing addresses:", error.message);
  }
  return [];
}

async function main() {
  try {
    // Get the deployer's signer and network
    const [deployer] = await hre.ethers.getSigners();
    const network = await deployer.provider.getNetwork();

    // Log deployer and balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

    // Deploy Enhanced SafePay contract
    console.log("\nDeploying Enhanced SafePay contract...");
    const SafePay = await hre.ethers.getContractFactory("contracts/SafePay.sol:SafePay");
    const safePay = await SafePay.deploy();
    await safePay.waitForDeployment();
    const safePayAddress = await safePay.getAddress();
    console.log(`Enhanced SafePay deployed to: ${safePayAddress}`);

    // Log deployment info
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Prepare the deployment directory
    const addressDir = path.join(__dirname, "..", "contract-address");
    if (!fs.existsSync(addressDir)) {
      fs.mkdirSync(addressDir, { recursive: true });
    }

    // Load existing deployments
    const deployments = loadExistingAddresses();

    // Create new deployment entry
    const newDeployment = {
      safePayAddress: safePayAddress,
      chainId: network.chainId.toString(),
      chainName: network.name,
      version: "enhanced", // Mark as enhanced version with ERC-20 support
      features: ["native_currency", "erc20_tokens"],
      deployedAt: new Date().toISOString()
    };
    
    // Find index of existing deployment for this network
    const existingIndex = deployments.findIndex(
      (d) => d.chainId === newDeployment.chainId
    );

    if (existingIndex !== -1) {
      // Update existing deployment
      deployments[existingIndex] = newDeployment;
      console.log(`\nUpdating existing deployment for ${network.name}...`);
    } else {
      // Add new deployment
      deployments.push(newDeployment);
      console.log(`\nAdding new deployment for ${network.name}...`);
    }

    // Write updated deployments to file
    fs.writeFileSync(
      CONTRACT_ADDRESSES_FILE,
      JSON.stringify(deployments, null, 2)
    );

    // Log deployment details
    console.log("\nDeployment successful! 🎉");
    console.log("========================================");
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`SafePay Address: ${safePayAddress}`);
    console.log(`Version: Enhanced (ERC-20 + Native Currency Support)`);
    console.log("========================================\n");

    // Log all deployments
    console.log("Contract Deployments:");
    deployments.forEach((d) => {
      const isCurrentDeployment = d.chainId === network.chainId.toString();
      const versionInfo = d.version ? ` (${d.version})` : "";
      console.log(
        `${d.chainName} (${d.chainId}): SafePay: ${d.safePayAddress}${versionInfo}${isCurrentDeployment ? " (Just Updated)" : ""}`
      );
    });
    console.log("\nDeployment history saved to:", CONTRACT_ADDRESSES_FILE);

    // Log new features
    console.log("\n🚀 New Features Available:");
    console.log("  - sendERC20ToWalletAddress()");
    console.log("  - sendERC20ToUserId()");
    console.log("  - claimERC20Transaction()");
    console.log("  - refundERC20Transaction()");
    console.log("  - Enhanced transaction details with token info");

    // Verify contract on Etherscan (optional)
    console.log("\nTo verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${safePayAddress}`);

  } catch (error) {
    console.error("\nDeployment failed!");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
