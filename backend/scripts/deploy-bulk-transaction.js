const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BulkTransactionManager contract...");

  // Get the contract factory
  const BulkTransactionManager = await hre.ethers.getContractFactory(
    "BulkTransactionManager"
  );

  // Deploy the contract
  const bulkTransactionManager = await BulkTransactionManager.deploy();

  // Wait for deployment
  await bulkTransactionManager.waitForDeployment();

  const contractAddress = await bulkTransactionManager.getAddress();

  console.log("BulkTransactionManager deployed to:", contractAddress);

  // Save the contract address to a JSON file
  const deploymentData = {
    contractAddress: contractAddress,
    chainId: hre.network.config.chainId.toString(),
    chainName: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  // Read existing deployments
  const deploymentsPath = path.join(
    __dirname,
    "../contract-address/bulk-transaction-addresses.json"
  );
  let deployments = [];

  if (fs.existsSync(deploymentsPath)) {
    const fileContent = fs.readFileSync(deploymentsPath, "utf8");
    deployments = JSON.parse(fileContent);
  } else {
    // Create directory if it doesn't exist
    const dir = path.dirname(deploymentsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Check if deployment for this chain already exists and update it
  const existingIndex = deployments.findIndex(
    (d) => d.chainId === deploymentData.chainId
  );
  if (existingIndex !== -1) {
    deployments[existingIndex] = deploymentData;
  } else {
    deployments.push(deploymentData);
  }

  // Save updated deployments
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log("Deployment data saved to:", deploymentsPath);

  // Copy ABI to frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/BulkTransactionManager.sol/BulkTransactionManager.json"
  );
  const frontendAbiPath = path.join(
    __dirname,
    "../../src/artifacts/BulkTransactionManager.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create directory if it doesn't exist
    const frontendDir = path.dirname(frontendAbiPath);
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }

    fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact, null, 2));
    console.log("ABI copied to frontend");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
