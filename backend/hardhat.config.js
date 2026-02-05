require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC;

if (!PRIVATE_KEY) {
  console.error("Please set your PRIVATE_KEY in a .env file");
  process.exit(1);
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arc: {
      url: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network/",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 5042002,
    },
    // add sei testnet
    "sei-testnet": {
      url: "https://evm-rpc-testnet.sei-apis.com",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 1328,
    },
    // add sepolia testnet
    sepolia: {
      url: `${SEPOLIA_RPC}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
    },
    // add hedera testnet
    "hedera-testnet": {
      url: "https://testnet.hashio.io/api",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 296,
    },
    // add rootstock testnet
    "rootstock-testnet": {
      url: "https://testnet.rootstock.com",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 30,
    },
    // add citera testnet
    "citera-testnet": {
      url: "https://rpc.testnet.citrea.xyz",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 5115,
    },
    // add world chain testnet
    "world-test": {
      url: "https://worldchain-sepolia.drpc.org",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 4801,
    },
    // add to flow EVM testnet
    "flow-test": {
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 545,
    },
    // add mantle sepolia testnet
    "mantle-sepolia": {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 5003,
    },
    // add polygon pos
    "poly-test": {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 80002,
    },
    // add to rootstock testnet
    "rootstock-test": {
      url: "https://public-node.testnet.rsk.co",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 31,
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
};
