export function formatTokenAmount(
  value: string | number | null | undefined,
  options: { maxDecimals?: number } = {}
): string {
  if (value === null || value === undefined) return "0";

  const num = Number(value);

  if (!Number.isFinite(num)) {
    return typeof value === "string" ? value : String(value);
  }

  const abs = Math.abs(num);
  const maxDecimals = options.maxDecimals ?? 6;

  if (abs === 0) {
    return "0";
  }

  if (abs >= 1) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(3, maxDecimals),
    });
  }

  if (abs >= 0.001) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(6, maxDecimals),
    });
  }

  if (abs >= 0.000000001) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(9, maxDecimals),
    });
  }

  return num.toExponential(2);
}
