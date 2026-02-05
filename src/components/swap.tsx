import { useSwap } from "@web3auth/modal/react";

export function SwapButton() {
  const { showSwap, loading, error } = useSwap();

  return (
    <div className="flex flex-col items-start">
      <button 
        onClick={() => showSwap()} 
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        {loading ? "Opening Swap..." : "Open Swap"}
      </button>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}

export default SwapButton;
