import { useChainId, useSwitchChain } from "wagmi";

export function SwitchChain() {
  const chainId = useChainId();
  const { chains, switchChain, error } = useSwitchChain();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Switch Chain</h2>
      <h3 className="text-lg font-medium text-slate-600 mb-6">Connected to {chainId}</h3>
      <div className="space-y-3">
        {chains.map((chain) => (
          <button
            disabled={chainId === chain.id}
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            type="button"
            className={`w-full p-4 text-center border-2 rounded-xl font-semibold transition-all duration-200 ${
              chainId === chain.id
                ? "bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-slate-50 hover:text-blue-600 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            }`}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {error?.message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error.message}
        </div>
      )}
    </div>
  );
}
