import type { AdminRole } from "@prisma/client";

export const PERMISSIONS = {
  catalogRead: "catalog.read",
  catalogWrite: "catalog.write",
  orderRead: "order.read",
  orderWrite: "order.write",
  orderFulfillUnpaid: "order.fulfill_unpaid",
  customerRead: "customer.read",
  customerWrite: "customer.write",
  contentWrite: "content.write",
  pricingWrite: "pricing.write",
  mediaWrite: "media.write",
  integrationWrite: "integration.write",
  adminWrite: "admin.write",
  auditRead: "audit.read",
  settingsWrite: "settings.write",
  codeReveal: "code.reveal",
  reportsRead: "reports.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL = Object.values(PERMISSIONS);

const ROLE_MAP: Record<AdminRole, PermissionKey[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((key) => key !== PERMISSIONS.orderFulfillUnpaid),
  CATALOG_MANAGER: [
    PERMISSIONS.catalogRead,
    PERMISSIONS.catalogWrite,
    PERMISSIONS.mediaWrite,
    PERMISSIONS.contentWrite,
    PERMISSIONS.reportsRead,
  ],
  ORDER_MANAGER: [
    PERMISSIONS.catalogRead,
    PERMISSIONS.orderRead,
    PERMISSIONS.orderWrite,
    PERMISSIONS.customerRead,
    PERMISSIONS.codeReveal,
    PERMISSIONS.reportsRead,
  ],
  CONTENT_MANAGER: [PERMISSIONS.catalogRead, PERMISSIONS.contentWrite, PERMISSIONS.mediaWrite],
  SUPPORT_AGENT: [PERMISSIONS.catalogRead, PERMISSIONS.orderRead, PERMISSIONS.customerRead, PERMISSIONS.customerWrite],
  VIEWER: [PERMISSIONS.catalogRead, PERMISSIONS.orderRead, PERMISSIONS.customerRead, PERMISSIONS.auditRead, PERMISSIONS.reportsRead],
};

export function rolePermissions(role: AdminRole): PermissionKey[] {
  return ROLE_MAP[role];
}

export function can(role: AdminRole | null | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  return ROLE_MAP[role].includes(permission);
}
