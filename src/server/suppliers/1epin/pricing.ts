import { percentOfFils } from "@/server/money";

/** Convert a supplier decimal amount to JOD fils using rateMicros (quote per 1 base * 1_000_000). */
export function supplierAmountToFils(amount: string, rateMicros: number | null): number | null {
  if (rateMicros == null || !Number.isInteger(rateMicros)) return null;
  const [whole, frac = ""] = amount.replace("-", "").split(".");
  const scaled = BigInt(whole || "0") * BigInt(10000) + BigInt((frac + "0000").slice(0, 4));
  const fils = (scaled * BigInt(rateMicros) * BigInt(1000)) / (BigInt(10000) * BigInt(1_000_000));
  return Number(fils);
}

function toScaled(amount: string): bigint {
  const negative = amount.startsWith("-");
  const [whole, frac = ""] = amount.replace("-", "").split(".");
  const value = BigInt(whole || "0") * BigInt(10000) + BigInt((frac + "0000").slice(0, 4));
  return negative ? -value : value;
}

function fromScaled(value: bigint): string {
  const sign = value < 0 ? "-" : "";
  const abs = value < 0 ? -value : value;
  const whole = abs / BigInt(10000);
  const frac = (abs % BigInt(10000)).toString().padStart(4, "0").replace(/0+$/, "");
  return frac ? `${sign}${whole}.${frac}` : `${sign}${whole}`;
}

export function costDelta(previous: string | null, next: string) {
  if (previous == null) return { previous: null, next, difference: null as string | null };
  return { previous, next, difference: fromScaled(toScaled(next) - toScaled(previous)) };
}

export { percentOfFils };
