# HackMoney 2026 Submission Info

## Q1) Short description

_(Max 100 characters)_

Secure ARC-based payments with Escrow, Universal Cross-Chain Transfers, and Max Yield Optimization.

---

## Q2) Description

_(Min 280 characters)_

SafeWallet Pay redefines the payment standard on **ARC Testnet** by combining institutional-grade safety with consumer-grade usability. We address the three biggest barriers to crypto adoption: transaction anxiety, chain fragmentation, and capital inefficiency.

**1. Fearless P2P Payments with Reversible Escrow**
The "fat-finger" error is the nightmare of every crypto user. SafeWallet Pay replaces the traditional "fire-and-forget" model with a **SafePay Escrow** protocol. Funds are never sent directly to a wallet address; instead, they are locked in a smart contract. The recipient must explicitly "claim" the funds using a unique transaction ID. Crucially, this introduces a native **"Undo" button**: if the sender types the wrong address, or if the recipient loses access to their wallet, the sender can unilaterally **refund** the unclaimed assets. This simple mechanism provides total peace of mind for both personal transfers and business settlements.

**2. The Universal Payment Layer (Powered by Yellow & LiFi)**
In a multi-chain world, paying someone shouldn't require a dozen preparatory steps. Our **Universal Payment System** makes chain boundaries invisible:

- **Yellow Vault**: Users deposit assets into state channels powered by **Yellow Network**, enabling instant, gas-free transfers between users within the ecosystem.
- **Any-to-Any Settlement**: When a receiver is ready to withdraw, they aren't forced to accept the sender's token. We leverage **LiFi Composer** to abstract the bridging and swapping process. A sender can pay in **USDC on ARC**, and the receiver can transparently claim **ETH on Base**, **USDT on Arbitrum**, or **MNT on Mantle**. We handle the complexity; the user just gets paid.

**3. Automated Wealth Generation with Max Yield**
Money at rest should be money at work. Our **Max Yield** engine transforms SafeWallet Pay from a simple wallet into a productivity tool. Using the **LiFi SDK**, we constantly scan cross-chain yield opportunities (e.g., Aave, Morpho). Users can instantly bridge and deposit their idle stablecoins into the highest-yielding verified vaults across the EVM ecosystem with a single click. This democratizes sophisticated DeFi strategies that were previously accessible only to power users.

**4. Business-Ready Infrastructure**
We streamline operations for DAOs and SMEs with our **Bulk Transaction Manager**, allowing thousands of payouts in a single transaction. Coupled with **Web3Auth** social logins (Google/Twitter), we ensure that onboarding employees or vendors is as easy as sending an email—no seed phrases required.

SafeWallet Pay isn't just a wallet; it's a complete financial operating system for the ARC ecosystem.

---

## Q3) How it's made

_(Min 280 characters)_

The core of SafeWallet Pay is built on **ARC Testnet** using **Solidity** smart contracts (`SafePay.sol` for escrow/refund logic and `BulkTransactionManager.sol` for batch payouts), deployed via **Hardhat**.

The frontend is a modern **React 18** application built with **Vite** and styled with **Tailwind CSS**. We utilized **Wagmi** and **Viem** for robust blockchain interactions.

**Key Integrations:**

1.  **LiFi SDK & Composer**: This is the engine behind our cross-chain capabilities. We use LiFi Composer in the _Universal Payment_ flow to allow receivers to swap/bridge their claimed funds into their preferred asset on any chain. We also use the LiFi SDK in _Max Yield_ to find and execute routes to high-APY vaults.
2.  **Yellow Network**: We integrated Yellow's state channels to create the "Yellow Vault." This allows for instant, gas-free off-chain balance updates between users before the final settlement/claim.
3.  **Web3Auth**: To ensure mainstream accessibility, we integrated Web3Auth for social logins (Google/Twitter), removing the friction of seed phrase management for new users.

**Notable Implementation:**
One distinctive piece of engineering was the "Universal Claim" flow. We had to orchestrate a hand-off between the internal state-channel balance (Yellow) and an on-chain execution (LiFi). When a user claims their balance, the app constructs a transaction that settles the state channel and immediately feeds that output into a LiFi route, effectively abstracting the complexity of "bridging" from the end user.
