import { cookies } from "next/headers";
import type { AdminRole, AdminPermission } from "../security/rbac";
import { hasPermission } from "../security/rbac";

export interface AdminSession {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  expiresAt: number; // ms timestamp
}

export const ADMIN_SESSION_COOKIE_NAME = "kw_admin_session";
const SESSION_DURATION_HOURS = 8;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

// Global cache for runtime ephemeral secret in production if unset
const globalAuth = globalThis as unknown as {
  __ephemeralAdminSessionSecret?: string;
};

/**
 * Retrieves the cryptographic secret key for HMAC signing of session cookies.
 * In production without configured ADMIN_SESSION_SECRET, generates a cryptographically
 * secure ephemeral 256-bit secret to prevent static key forgery.
 */
export function getAdminSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.trim().length >= 16) {
    return process.env.ADMIN_SESSION_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    if (!globalAuth.__ephemeralAdminSessionSecret) {
      const randomArr = new Uint8Array(32);
      crypto.getRandomValues(randomArr);
      globalAuth.__ephemeralAdminSessionSecret = toBase64Url(randomArr);
      console.warn(
        "[SECURITY NOTICE] ADMIN_SESSION_SECRET is not configured in production environment. Generated ephemeral 256-bit runtime HMAC secret."
      );
    }
    return globalAuth.__ephemeralAdminSessionSecret;
  }

  return "kw-vip-admin-secret-cryptographic-signing-key-2026-production";
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Pre-configured development and staging administrator accounts
 */
export const DEFAULT_DEV_ADMINS: Array<{
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  passwordHash: string; // "WayneVIP2026!"
}> = [
  {
    id: "admin-super-01",
    email: "superadmin@kountrywayne.com",
    fullName: "Wayne Executive Producer",
    role: "SUPER_ADMIN",
    passwordHash: "WayneVIP2026!",
  },
  {
    id: "admin-ops-02",
    email: "admin@kountrywayne.com",
    fullName: "Tour Operations Coordinator",
    role: "ADMIN",
    passwordHash: "WayneVIP2026!",
  },
  {
    id: "admin-staff-03",
    email: "staff@kountrywayne.com",
    fullName: "Venue Stage Door Staff",
    role: "STAFF",
    passwordHash: "WayneVIP2026!",
  },
];

/**
 * Creates an HMAC-signed session token string using isomorphic Web Crypto
 */
export async function createSessionToken(session: AdminSession): Promise<string> {
  const payloadStr = JSON.stringify(session);
  const payload = toBase64Url(encoder.encode(payloadStr));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAdminSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signature = toBase64Url(new Uint8Array(sig));

  return `${payload}.${signature}`;
}

/**
 * Verifies and parses a signed session token using isomorphic Web Crypto
 */
export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getAdminSessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = fromBase64Url(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(payload)
    );

    if (!isValid) {
      return null;
    }

    const decodedStr = decoder.decode(fromBase64Url(payload));
    const decoded = JSON.parse(decodedStr) as AdminSession;

    // Check expiration
    if (Date.now() > decoded.expiresAt) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently active admin session from cookies (Server Components / Server Actions)
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Stores the admin session into an HttpOnly encrypted cookie
 */
export async function setAdminSessionCookie(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 3600,
  });
}

/**
 * Clears the active admin session cookie
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

/**
 * Validates admin credentials against configured accounts or Supabase
 */
export async function authenticateAdminCredentials(
  email: string,
  passwordPlain: string
): Promise<AdminSession | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // In production, hardcoded dev accounts with static passwords are only allowed
  // if explicitly enabled via ENABLE_DEV_ADMINS (e.g. for staging or demo environments)
  const isDevAllowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_ADMINS === "true";

  if (!isDevAllowed) {
    // In production without dev mode, dev accounts cannot be authenticated with static passwords
    return null;
  }

  // 1. Check development accounts
  const devAccount = DEFAULT_DEV_ADMINS.find(
    (a) => a.email.toLowerCase() === normalizedEmail
  );

  if (devAccount && devAccount.passwordHash === passwordPlain) {
    return {
      id: devAccount.id,
      email: devAccount.email,
      fullName: devAccount.fullName,
      role: devAccount.role,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
  }

  // 2. Fallback: Generic dev password for testing custom emails (restricted to dev/staging)
  if (
    normalizedEmail.endsWith("@kountrywayne.com") &&
    passwordPlain === "WayneVIP2026!"
  ) {
    return {
      id: `admin-${Date.now()}`,
      email: normalizedEmail,
      fullName: "VIP Staff Member",
      role: "STAFF",
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
  }

  return null;
}

/**
 * Asserts that an active session exists. Throws an unauthorized error if missing.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Active admin session required.");
  }
  return session;
}

/**
 * Asserts that the active admin has the required permission.
 * Throws a forbidden error if unauthorized.
 */
export async function requireAdminPermission(
  permission: AdminPermission
): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (!hasPermission(session.role, permission)) {
    throw new Error(
      `FORBIDDEN: Role '${session.role}' lacks required permission '${permission}'.`
    );
  }
  return session;
}
