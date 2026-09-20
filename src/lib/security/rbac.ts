export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export type AdminPermission =
  | "cities:view"
  | "cities:manage"
  | "registrations:view"
  | "registrations:manage"
  | "schedules:view"
  | "schedules:manage"
  | "fan_cards:view"
  | "fan_cards:manage_status"
  | "communications:send"
  | "audit_logs:view"
  | "admin_users:manage"
  | "data:export";

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "cities:view",
    "cities:manage",
    "registrations:view",
    "registrations:manage",
    "schedules:view",
    "schedules:manage",
    "fan_cards:view",
    "fan_cards:manage_status",
    "communications:send",
    "audit_logs:view",
    "admin_users:manage",
    "data:export",
  ],
  ADMIN: [
    "cities:view",
    "cities:manage",
    "registrations:view",
    "registrations:manage",
    "schedules:view",
    "schedules:manage",
    "fan_cards:view",
    "fan_cards:manage_status",
    "communications:send",
    "audit_logs:view",
    "data:export",
  ],
  STAFF: [
    "registrations:view",
    "schedules:view",
    "fan_cards:view",
    "fan_cards:manage_status",
  ],
};

/**
 * Checks if a specific role possesses a required permission.
 */
export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a role has access to a specific admin URL pathname.
 */
export function canAccessPath(role: AdminRole, pathname: string): boolean {
  const cleanPath = pathname.replace(/\/$/, "");

  // Dashboard root and login/unauthorized are accessible to all authenticated roles
  if (
    cleanPath === "/admin" ||
    cleanPath === "/admin/login" ||
    cleanPath === "/admin/unauthorized"
  ) {
    return true;
  }

  if (cleanPath.startsWith("/admin/cities")) {
    return hasPermission(role, "cities:view");
  }

  if (cleanPath.startsWith("/admin/registrations")) {
    return hasPermission(role, "registrations:view");
  }

  if (cleanPath.startsWith("/admin/schedules")) {
    return hasPermission(role, "schedules:view");
  }

  if (cleanPath.startsWith("/admin/fan-cards")) {
    return hasPermission(role, "fan_cards:view");
  }

  if (cleanPath.startsWith("/admin/audit-logs")) {
    return hasPermission(role, "audit_logs:view");
  }

  if (cleanPath.startsWith("/admin/users")) {
    return hasPermission(role, "admin_users:manage");
  }

  // Default allow child routes if authenticated
  return true;
}

/**
 * Formats a role enum into a human-readable display title.
 */
export function formatRoleTitle(role: AdminRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Administrator";
    case "ADMIN":
      return "Tour Administrator";
    case "STAFF":
      return "Fulfillment Staff";
    default:
      return role;
  }
}
