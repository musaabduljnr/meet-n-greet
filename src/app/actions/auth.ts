"use server";

import { redirect } from "next/navigation";
import {
  authenticateAdminCredentials,
  clearAdminSessionCookie,
  getAdminSession,
  setAdminSessionCookie,
  type AdminSession,
} from "@/lib/auth/admin-auth";
import { recordAdminAuditLog } from "@/lib/security/audit";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Authenticates staff credentials and creates an encrypted admin session cookie.
 */
export async function loginAdminAction(
  formData: FormData
): Promise<LoginActionResult> {
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const returnUrl = (formData.get("returnUrl") as string) || "/admin";

  if (!email.trim() || !password) {
    return {
      success: false,
      error: "Please provide both an administrator email and password.",
    };
  }

  const session = await authenticateAdminCredentials(email, password);

  if (!session) {
    return {
      success: false,
      error: "Invalid email or password. Access is restricted to authorized staff.",
    };
  }

  // Set session cookie
  await setAdminSessionCookie(session);

  // Record audit log
  await recordAdminAuditLog({
    adminId: session.id,
    adminEmail: session.email,
    adminRole: session.role,
    action: "AUTH_LOGIN",
    entityTable: "admins",
    entityId: session.id,
    details: `Staff member signed in with role ${session.role}`,
  });

  return {
    success: true,
    redirectUrl: returnUrl.startsWith("/admin") ? returnUrl : "/admin",
  };
}

/**
 * Destroys the admin session and redirects to the login screen.
 */
export async function logoutAdminAction(): Promise<void> {
  const session = await getAdminSession();

  if (session) {
    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "AUTH_LOGOUT",
      entityTable: "admins",
      entityId: session.id,
      details: "Staff member signed out",
    });
  }

  await clearAdminSessionCookie();
  redirect("/admin/login");
}

/**
 * Server action to inspect active admin session for client components
 */
export async function getCurrentAdminSessionAction(): Promise<{
  session: AdminSession | null;
}> {
  const session = await getAdminSession();
  return { session };
}
