# SafeWallet Pay

A secure **ARC Testnet-based** P2P payment platform featuring **Universal Payments**, **Max Yield Optimization**, **Escrow**, and **Bulk Transaction Management**.  
Built on **ARC Testnet** with **Web3Auth** onboarding, **LiFi SDK** for cross-chain capabilities, and a modern React UI.

---

## 📤 Submission Info

> **Submitted for HackMoney 2026 Hackathon**

- **🌐 Live Demo**: [https://mantle-hack-defi-project.vercel.app/](https://mantle-hack-defi-project.vercel.app/)
- **🎥 Presentation Video**: [https://youtu.be/0f7it-S-yyQ?si=nSX0KkfqKWn3FEZU](https://youtu.be/0f7it-S-yyQ?si=nSX0KkfqKWn3FEZU)

---

## 📋 Problem Statement

Traditional crypto payments have critical issues, especially for everyday users and businesses in :

- **No protection for wrong-address transfers**
  - If you paste or type the wrong wallet address, the funds are gone forever.
  - There is **no native “undo” or refund option** once a transaction is broadcast.
- **No escrow / claim process**
  - Funds are sent directly to the recipient with no “claim step”, making disputes and trust hard to manage.
- **No sender-controlled refunds**
  - Even if the recipient never uses or even sees the funds, the sender has no way to pull them back.
- **Inefficient bulk payouts**
  - Paying salaries, vendors, community members or grant recipients needs many on-chain transactions, increasing cost and complexity.
- **Complex onboarding & UX**
  - Seed phrases, network configuration, and raw hex addresses are intimidating for new users.
- **Infrastructure gaps**
  - Many users need low-fee, fast, programmable payments for micro‑transactions, remittances, and bulk payouts, but don't get that from traditional rails.

---

## 💡 Our Solution

SafeWallet Pay adds a **smart-contract escrow layer**, **Universal Payment System**, and **Max Yield Optimization** on top of ARC Testnet:

1. **Universal Payment System**
   - Senders deposit crypto assets on-chain into the **Yellow Vault** (Yellow Network state channels).
   - Payments are sent instantly off-chain.
   - Receivers claim funds on their **preferred blockchain** in their **preferred token**.
   - Powered by **LiFi Composer** for seamless bridging and swapping.
2. **Max Yield Optimizer**
   - Utilizes **LiFi SDK** to bridge and swap stablecoins to the highest yielding protocols across multiple chains.
3. **Escrow-first payments**
   - Funds are locked in the `SafePay` contract instead of going directly to the recipient.
4. **Claim-based receiving**
   - Recipients explicitly **claim** funds (Native or ERC‑20) with a transaction ID.
5. **Refunds for unclaimed & misdirected funds**
   - If a payment is never claimed, the **sender can refund** and recover the funds.
   - This gives a safety net for **wrong-address transfers**, as long as the funds remain unclaimed in escrow.
6. **Bulk Transaction Manager**
   - Send many payments in a single transaction to save cost and simplify operations.
7. **Smooth onboarding**
   - Web3Auth enables social logins alongside traditional wallets.

Result: a safer, more forgiving, and universally compatible payment flow.

---

## ✨ Core Features

### 1. 🌐 Universal Payment & Max Yield

- **Universal Payment System**:
  - Deposit on-chain assets to **Yellow Vault**.
  - Instant internal transfers.
  - Receiver claims in **any token on any chain** (Multichain Bridge & Swap via LiFi Composer).
- **Max Yield**:
  - Automatically routes stablecoins to the best yield opportunities.
  - Uses **LiFi SDK** for efficient cross-chain bridging and swapping.

### 2. 🔐 Safe P2P Escrow Payments

- Funds always go **into escrow first**, not directly to the recipient.
- Recipients **claim** funds using a transaction ID.
- Senders can **refund unclaimed payments**, including:
  - Mistaken transfers to a wrong recipient address that never claims.
  - Send by:
    - **Wallet address**, or
    - **Registered user ID**.
  - Supported assets:
    - Native **ARC** tokens.
    - ERC‑20 tokens on ARC Testnet.

### 2. 👥 Bulk Transaction Manager

- Create **bulk payouts** in one transaction:
  - Configure individual amounts per recipient.
  - Suitable for payroll, bounties, vendor payments, and airdrops.
- Bulk transaction history to audit and review previous payouts.

### 3. 🧾 Refund & History Layer

- View all:
  - **Pending** (escrowed, not yet claimed),
  - **Claimed**, and
  - **Refunded** transactions.
- Trigger refunds for unclaimed escrow payments via UI.
- Clear, human-readable statuses for every transaction.

### 4. 🔑 Authentication & UX

- **Web3Auth** for:
  - Social logins (Google, Twitter, etc.),
  - Key management abstraction.
- Support for **MetaMask** and other Web3 wallets.
- Mobile-first, responsive UI with Tailwind CSS and Framer Motion.

---

## 🌍 How It Empowers Users on ARC Testnet

- **Universal Connectivity**
  - Pay anyone, anywhere, regardless of their preferred chain or token.
- **Yield Optimization**
  - Idle stablecoins work harder with automated yield routing.
- **Low fees & high throughput**
  - ARC's architecture provides low transaction costs.
- **Fast finality**
  - Quick block times enable real‑time retail payments and remittances.
- **Refundable escrow in trust‑poor environments**
  - Users and SMEs can send money with the confidence that unclaimed or misdirected escrow payments can be refunded.
- **Efficient bulk payouts**
  - SMEs, cooperatives, DAOs, and NGOs can pay many people at once — salaries, rewards, grants, and more.
- **Inclusive onboarding**
  - Web3Auth reduces the cognitive load of using crypto.

---

## 🛠️ Architecture & Tech Stack

### Frontend

- **React 18 + TypeScript**
- **Vite** for dev/build.
- **Tailwind CSS** for styling.
- **LiFi SDK & Composer** for cross-chain bridge and swap.
- **Yellow Network** for state channels and instant payments.
- **Wagmi v2 & Viem** for RPC and contract calls.
- **Framer Motion** for animations.
- **React Router** for client-side routing.

### Smart Contracts (Backend)

- **Solidity 0.8.x** with **Hardhat**.
- `SafePay.sol`
  - Escrow-based payments.
  - Claim + refund logic (MNT and ERC‑20).
  - User ID registry & lookup.
- `BulkTransactionManager.sol`
  - Bulk native & ERC‑20 transfers.
  - Transaction history storage.
- Uses **OpenZeppelin**:
  - `ReentrancyGuard`, `Ownable`, `SafeERC20`, `IERC20`.

### Authentication & Network

- **Web3Auth** for social & wallet-based login.
- Primary target network:
  - **ARC Testnet**.

---

## 📁 Project Structure (High Level)

```txt
Hedera-Payment-interface/
├── src/
│   ├── components/
│   │   ├── safe-pay/                 # SafePay escrow UI (send, claim, history)
│   │   ├── bulk-transaction/         # Bulk transfer UI
│   │   └── shared/                   # Shared header/layout components
│   ├── pages/                        # Route-level pages
│   ├── hooks/                        # Custom React hooks
│   ├── utils/                        # Contract calls, validation, config
│   ├── artifacts/                    # Frontend ABIs (SafePay, BulkTransactionManager)
│   ├── context/                      # Wallet & Web3Auth context providers
│   └── main.tsx                      # App entry & provider wiring
│
├── backend/
│   ├── contracts/                    # Solidity contracts
│   ├── scripts/                      # Hardhat deployment scripts
│   ├── artifacts/                    # Compiled ABIs & build info
│   ├── contract-address/             # Deployed address JSON
│   └── hardhat.config.js             # Hardhat & network config
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **v18+**
- `pnpm` or `npm`
- A Web3 wallet (e.g. MetaMask)
- Web3Auth client ID

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Hedera-Payment-interface

# Frontend
pnpm install        # or: npm install

# Backend
cd backend
pnpm install        # or: npm install
cd ..
```

### 2. Environment Variables

Create `.env` in the **project root**:

```bash
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

Create `.env` in the **backend** folder for deployments:

```bash
PRIVATE_KEY=your_deployer_private_key   # EVM-compatible deployer on ARC Testnet
```

### 3. Run the Frontend

```bash
pnpm dev       # or: npm run dev
```

App will run at `http://localhost:5173`.

### 4. Build for Production

```bash
pnpm build     # or: npm run build
```

Production assets will be generated in `dist/`.

---

## 📝 Smart Contract Deployment (ARC Testnet)

### 1. Deploy SafePay

```bash
cd backend
npx hardhat run scripts/safepay-deploy.js --network arc-testnet
```

### 2. Deploy BulkTransactionManager

```bash
cd backend
npx hardhat run scripts/deploy-bulk-transaction.js --network arc-testnet
```

### 3. Update Frontend Addresses

After deployment, update:

- `src/utils/contract-address/safePay-address.json`
- `src/utils/contract-address/bulk-transaction-addresses.json`

### 4. Copy ABIs to Frontend

```bash
# SafePay ABI
cp backend/artifacts/contracts/SafePay.sol/SafePay.json \
src/artifacts/SafePay.json

# BulkTransactionManager ABI
cp backend/artifacts/contracts/BulkTransactionManager.sol/BulkTransactionManager.json \
src/artifacts/BulkTransactionManager.json
```

---

## 📍 Current ARC Testnet Deployment

### SafePay (Escrow Contract)

- **Address**: `0x5e6c03E14002aF759680cd86ad4534D4b8FA0648`
- **Network**: `ARC Testnet`
- **Deployed**: January 14, 2026
- **Tokens**:
  - Native: **ARC**
  - ERC‑20: Supported tokens on ARC Testnet

### BulkTransactionManager

- **Address**: `0xd4DA259c0d1aae023B5F19254697f7C307af5aE5`
- **Network**: `ARC Testnet`
- **Deployed**: January 14, 2026

These addresses are also configured in:

- `src/utils/contract-address/safePay-address.json`
- `src/utils/contract-address/bulk-transaction-addresses.json`
- `src/utils/contract-address/safePay-tokens.json`

---

## 🔒 Security & Design Considerations

- **Escrow & Refund Logic**
  - Payments are **claim-based**; funds remain in escrow until claimed.
  - Senders can **refund unclaimed funds**, reducing damage from wrong-address mistakes.
- **Reentrancy & Safe Transfers**
  - `ReentrancyGuard` on state-changing functions.
  - `SafeERC20` for token transfers.
- **Access Control**
  - `Ownable` for admin operations and controlled upgrades.
- **Input & Amount Validation**
  - Frontend and contract-level checks for amounts, arrays, and addresses.
- **ARC Testnet Benefits**
  - Scalable, low-cost infrastructure.

---

## 🗺️ Future Roadmap

- **Universal Payment Solution (Cross‑Chain, Any Token)**
  - Allow users to **create and manage payment requests** with:
    - Preferred blockchain (e.g. Mantle, EVM L2s, etc.),
    - Preferred token (MNT, stablecoins, or ERC‑20s),
    - Total amount to receive.
  - Generate a **payment link** that can be shared with the payer.
  - The receiver connects their wallet; if their funds are on **another chain or in another token**, the platform:
    - Requests **allowance** on the payer's chosen token/chain,
    - Automatically orchestrates **swap + bridge** steps behind the scenes,
    - Delivers funds to the receiver in their **preferred token on their preferred blockchain**.
  - Goal: make crypto payments feel like a single, universal payment network, regardless of where liquidity lives.
- **Unified Balance System**
  - Show a **single aggregated balance view** across multiple chains and tokens.
  - Normalize balances into a common unit (e.g. USD equivalent) while still showing per‑asset details.
  - Power better UX for the universal payment solution and future cross‑chain features.
- Better **UX messaging** around wrong-address mistakes and refund windows.
- Additional **tokens** and **stablecoins** on Mantle.
- **Fiat on‑ramp/off‑ramp** integration.
- Bulk payout analytics & CSV export.

SafeWallet Pay brings **safer, refundable, and universally compatible crypto payments** to ARC Testnet — tailored for real users and businesses across the World.
