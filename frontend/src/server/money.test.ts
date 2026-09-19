import { describe, expect, it } from "vitest";
import { addFils, filsToJod, formatFils, jodToFils, marginBps, multiplyFils, percentOfFils } from "@/server/money";
import { can, PERMISSIONS } from "@/server/auth/permissions";
import { validatePasswordStrength } from "@/server/auth/password";

describe("JOD fils conversion", () => {
  it("converts 1 JOD to 1000 fils", () => {
    expect(jodToFils(1)).toBe(1000);
    expect(filsToJod(1000)).toBe(1);
  });
  it("keeps 3 decimal fils", () => {
    expect(jodToFils(39.9)).toBe(39900);
    expect(formatFils(39900)).toBe("39.9");
  });
  it("multiplies without floats", () => {
    expect(multiplyFils(39900, 2)).toBe(79800);
    expect(addFils(1000, 250)).toBe(1250);
  });
  it("computes margin in basis points", () => {
    expect(marginBps(10000, 7800)).toBe(2200);
    expect(percentOfFils(10000, 2200)).toBe(2200);
  });
});

describe("RBAC helpers", () => {
  it("grants SUPER_ADMIN catalog write", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.catalogWrite)).toBe(true);
  });
  it("denies VIEWER catalog write", () => {
    expect(can("VIEWER", PERMISSIONS.catalogWrite)).toBe(false);
  });
});

describe("password strength helper", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordStrength("short").ok).toBe(false);
  });
  it("accepts longer passwords", () => {
    expect(validatePasswordStrength("long-enough-password").ok).toBe(true);
  });
});
