/** JOD money in integer fils. 1 JOD = 1,000 fils. Never use floating-point for totals. */

export const FILS_PER_JOD = BigInt(1000);

export function jodToFils(jod: number): number {
  if (!Number.isFinite(jod)) throw new Error("Invalid JOD amount");
  const [whole, frac = ""] = jod.toString().split(".");
  const padded = (frac + "000").slice(0, 3);
  const sign = jod < 0 ? -1 : 1;
  const fils = BigInt(Math.abs(Number(whole || "0"))) * FILS_PER_JOD + BigInt(padded);
  return Number(fils) * sign;
}

export function filsToJod(fils: number): number {
  if (!Number.isInteger(fils)) throw new Error("Fils must be an integer");
  return Number(BigInt(fils)) / 1000;
}

export function formatFils(fils: number): string {
  const negative = fils < 0;
  const abs = BigInt(Math.abs(fils));
  const jod = abs / FILS_PER_JOD;
  const rem = abs % FILS_PER_JOD;
  const body = rem === BigInt(0) ? `${jod}` : `${jod}.${rem.toString().padStart(3, "0").replace(/0+$/, "")}`;
  return negative ? `-${body}` : body;
}

export function multiplyFils(fils: number, quantity: number): number {
  if (!Number.isInteger(fils) || !Number.isInteger(quantity)) throw new Error("Integer required");
  return Number(BigInt(fils) * BigInt(quantity));
}

export function addFils(...amounts: number[]): number {
  return Number(amounts.reduce((sum, value) => sum + BigInt(value), BigInt(0)));
}

export function percentOfFils(fils: number, bps: number): number {
  return Number((BigInt(fils) * BigInt(bps)) / BigInt(10000));
}

export function marginBps(priceFils: number, costFils: number): number {
  if (priceFils <= 0) return 0;
  return Number(((BigInt(priceFils) - BigInt(costFils)) * BigInt(10000)) / BigInt(priceFils));
}
