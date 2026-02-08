# HackMoney 2026 Submission Info

## Q1) Short description
*(Max 100 characters)*

Secure ARC-based payments with Escrow, Universal Cross-Chain Transfers, and Max Yield Optimization.

---

## Q2) Description
*(Min 280 characters)*

SafeWallet Pay transforms the crypto payment experience on ARC Testnet by prioritizing safety and interoperability. We solve the fear of "wrong-address" transfers with our **SafePay Escrow**, ensuring funds are only transferred when claimed by the intended recipient—or refunded by the sender if left unclaimed.

Beyond safety, we solve fragmentation with our **Universal Payment System**. Users can deposit assets into our Yellow Vault (powered by Yellow Network state channels) and send payments instantly. Receivers can then claim these funds on *any* chain in *any* token, powered by **LiFi Composer's** seamless cross-chain bridging.

We also introduced **Max Yield**, a feature that puts idle stablecoins to work by automatically routing them to the highest-yielding protocols across the ecosystem using **LiFi SDK**. Whether for individual P2P transfers or bulk payroll via our **Bulk Transaction Manager**, SafeWallet Pay makes crypto payments safer, smarter, and universally compatible.

---

## Q3) How it's made
*(Min 280 characters)*

The core of SafeWallet Pay is built on **ARC Testnet** using **Solidity** smart contracts (`SafePay.sol` for escrow/refund logic and `BulkTransactionManager.sol` for batch payouts), deployed via **Hardhat**.

The frontend is a modern **React 18** application built with **Vite** and styled with **Tailwind CSS**. We utilized **Wagmi** and **Viem** for robust blockchain interactions.

**Key Integrations:**
1.  **LiFi SDK & Composer**: This is the engine behind our cross-chain capabilities. We use LiFi Composer in the *Universal Payment* flow to allow receivers to swap/bridge their claimed funds into their preferred asset on any chain. We also use the LiFi SDK in *Max Yield* to find and execute routes to high-APY vaults.
2.  **Yellow Network**: We integrated Yellow's state channels to create the "Yellow Vault." This allows for instant, gas-free off-chain balance updates between users before the final settlement/claim.
3.  **Web3Auth**: To ensure mainstream accessibility, we integrated Web3Auth for social logins (Google/Twitter), removing the friction of seed phrase management for new users.

**Notable Implementation:**
One distinctive piece of engineering was the "Universal Claim" flow. We had to orchestrate a hand-off between the internal state-channel balance (Yellow) and an on-chain execution (LiFi). When a user claims their balance, the app constructs a transaction that settles the state channel and immediately feeds that output into a LiFi route, effectively abstracting the complexity of "bridging" from the end user.
