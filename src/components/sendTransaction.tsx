import { FormEvent } from "react";
import {
  useWaitForTransactionReceipt,
  useSendTransaction,
  BaseError,
} from "wagmi";
import { Hex, parseEther } from "viem";

export function SendTransaction() {
  const {
    data: hash,
    error,
    isPending,
    sendTransaction,
  } = useSendTransaction();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const to = formData.get("address") as Hex;
    const value = formData.get("value") as string;
    sendTransaction({ to, value: parseEther(value) });
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Send Transaction</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <input
            name="address"
            placeholder="Recipient Address"
            required
            className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 hover:border-blue-300"
          />
        </div>
        <div className="flex gap-3 items-end">
          <input
            name="value"
            placeholder="Amount (ETH)"
            type="number"
            step="0.000000001"
            required
            className="flex-1 max-w-xs p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 hover:border-blue-300"
          />
          <button 
            disabled={isPending} 
            type="submit" 
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0 whitespace-nowrap"
          >
            {isPending ? "Confirming..." : "Send"}
          </button>
        </div>
      </form>
      
      {hash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-800 font-medium">Transaction Hash: </span>
          <span className="text-green-700 font-mono text-sm break-all">{hash}</span>
        </div>
      )}
      
      {isConfirming && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Waiting for confirmation...
        </div>
      )}
      
      {isConfirmed && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Transaction confirmed.
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {(error as BaseError).shortMessage || error.message}
        </div>
      )}
    </div>
  );
}
