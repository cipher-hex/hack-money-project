import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function Balance() {
  const { address } = useAccount();

  const { data, isLoading, error } = useBalance({ address });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Balance</h2>
      <div className="text-2xl font-bold text-slate-900">
        {data?.value !== undefined && (
          <span className="text-green-600">
            {formatUnits(data.value, data.decimals)} {data.symbol}
          </span>
        )}
        {isLoading && (
          <span className="text-blue-600 text-base font-normal">Loading...</span>
        )}
        {error && (
          <span className="text-red-600 text-base font-normal">
            Error: {error.message}
          </span>
        )}
      </div>
    </div>
  );
}
