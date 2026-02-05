import { useWalletUI } from "@web3auth/modal/react";

export function WalletUIButton() {
  const { showWalletUI, loading, error } = useWalletUI();

  return (
    <div>
      <button onClick={() => showWalletUI()} disabled={loading}>
        {loading ? "Opening Wallet UI..." : "Show Wallet UI"}
      </button>
      {error && <div>{error.message}</div>}
    </div>
  );
}

export default WalletUIButton;
