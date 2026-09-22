import type { AdminRole } from "./rbac";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";


export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "STATUS_CHANGE"
  | "SCHEDULE_CHANGE"
  | "CITY_CHANGE"
  | "CITY_DELETE"
  | "DATA_EXPORT"
  | "ADMIN_ACCOUNT_CHANGE"
  | "COMMUNICATION_DISPATCH";

export interface AdminAuditEntry {
  id?: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: AuditAction;
  entityTable: string;
  entityId: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt?: string;
}

export interface StoredAuditLog extends AdminAuditEntry {
  id: string;
  createdAt: string;
}

// In-memory audit log store for development, testing, and offline fallback
const inMemoryAuditLogs: StoredAuditLog[] = [];

/**
 * Records an immutable administrative audit log entry.
 * Non-blocking: logs failures without breaking the calling transaction.
 */
export async function recordAdminAuditLog(
  entry: Omit<AdminAuditEntry, "id" | "createdAt">
): Promise<StoredAuditLog> {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();

  const record: StoredAuditLog = {
    ...entry,
    id: logId,
    createdAt: timestamp,
  };

  inMemoryAuditLogs.unshift(record);

  // Trim in-memory buffer to last 1000 items
  if (inMemoryAuditLogs.length > 1000) {
    inMemoryAuditLogs.pop();
  }

  // Persist to Supabase audit_logs table if configured
  const client = supabaseAdmin || supabase;
  if (isSupabaseConfigured && client) {
    try {
      await client.from("audit_logs").insert({
        id: logId,
        admin_id: entry.adminId.startsWith("mock-") || entry.adminId.startsWith("admin-") ? null : entry.adminId,
        action: entry.action,
        entity_table: entry.entityTable,
        entity_id: entry.entityId,
        old_state: entry.oldState,
        new_state: entry.newState,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: timestamp,
      });
    } catch (err) {
      console.error("[AuditLog DB Error]", err);
    }
  }

  return record;
}

/**
 * Retrieves audit logs with optional filtering
 */
export function getAdminAuditLogs(filter?: {
  action?: AuditAction;
  adminEmail?: string;
  entityTable?: string;
  limit?: number;
}): StoredAuditLog[] {
  let list = [...inMemoryAuditLogs];

  if (filter?.action) {
    list = list.filter((item) => item.action === filter.action);
  }

  if (filter?.adminEmail) {
    const email = filter.adminEmail.toLowerCase().trim();
    list = list.filter((item) => item.adminEmail.toLowerCase() === email);
  }

  if (filter?.entityTable) {
    list = list.filter((item) => item.entityTable === filter.entityTable);
  }

  if (filter?.limit) {
    list = list.slice(0, filter.limit);
  }

  return list;
}

/**
 * Retrieves audit logs with optional filtering from Supabase or fallback store
 */
export async function getAdminAuditLogsAsync(filter?: {
  action?: AuditAction;
  adminEmail?: string;
  entityTable?: string;
  limit?: number;
}): Promise<StoredAuditLog[]> {
  const client = supabaseAdmin || supabase;
  if (isSupabaseConfigured && client) {
    try {
      let query = client
        .from("audit_logs")
        .select(`
          id,
          admin_id,
          action,
          entity_table,
          entity_id,
          old_state,
          new_state,
          ip_address,
          user_agent,
          created_at,
          admins:admin_id (email, role)
        `)
        .order("created_at", { ascending: false });

      if (filter?.action) {
        query = query.eq("action", filter.action);
      }

      if (filter?.entityTable) {
        query = query.eq("entity_table", filter.entityTable);
      }

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let list: StoredAuditLog[] = data.map((item: any) => {
          const adminObj = Array.isArray(item.admins) ? item.admins[0] : item.admins;
          return {
            id: item.id,
            adminId: item.admin_id || "system",
            adminEmail: adminObj?.email || "system@kountrywayne.vip",
            adminRole: adminObj?.role || "ADMIN",
            action: item.action as AuditAction,
            entityTable: item.entity_table,
            entityId: item.entity_id,
            oldState: item.old_state,
            newState: item.new_state,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
            createdAt: item.created_at,
          };
        });

        if (filter?.adminEmail) {
          const email = filter.adminEmail.toLowerCase().trim();
          list = list.filter((item) => item.adminEmail.toLowerCase() === email);
        }

        return list;
      }
    } catch (err) {
      console.error("[AuditLog Fetch Error]", err);
    }
  }

  return getAdminAuditLogs(filter);
}


/**
 * Clears in-memory audit logs (used for unit tests)
 */
export function clearAuditLogs(): void {
  inMemoryAuditLogs.length = 0;
}

