"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  Filter,
  Code2,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { getAuditLogsAction } from "@/app/actions/admin";
import type { StoredAuditLog, AuditAction } from "@/lib/security/audit";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<StoredAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspector Modal
  const [inspectedLog, setInspectedLog] = useState<StoredAuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await getAuditLogsAction({
      action: selectedAction !== "all" ? (selectedAction as AuditAction) : undefined,
      adminEmail: adminFilter || undefined,
      limit: 100,
    });

    if (res.success && res.data) {
      setLogs(res.data);
    } else {
      setErrorMessage(res.error || "Failed to load audit logs.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "STATUS_CHANGE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30">
            STATUS_CHANGE
          </span>
        );
      case "SCHEDULE_CHANGE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30">
            SCHEDULE_CHANGE
          </span>
        );
      case "CITY_CHANGE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#6EE7B7] border border-[#10B981]/30">
            CITY_CHANGE
          </span>
        );
      case "DATA_EXPORT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
            DATA_EXPORT
          </span>
        );
      case "AUTH_LOGIN":
      case "AUTH_LOGOUT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6B7280]/20 text-[#D1D5DB] border border-[#4B5563]">
            {action}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1F1F28] text-white">
            {action}
          </span>
        );
    }
  };

  return (
    <AdminShell
      title="Administrative Audit Trail"
      subtitle="Immutable compliance ledger tracking every administrative mutation, schedule assignment, and status change."
    >
      <div className="space-y-6">
        {errorMessage && (
          <Alert variant="error" title="Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9E9EAF]">
              Audit Records: <strong className="text-white">{logs.length}</strong> logged events
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh Ledger
          </Button>
        </div>

        {/* Filter Bar */}
        <Card>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 flex gap-2">
              <Input
                placeholder="Filter by admin operator email..."
                leftIcon={<Search className="h-4 w-4" />}
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={fetchLogs}
                className="shrink-0"
              >
                Filter
              </Button>
            </div>

            <div className="sm:col-span-4">
              <Select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                options={[
                  { value: "all", label: "All Audit Actions" },
                  { value: "STATUS_CHANGE", label: "Status Changes" },
                  { value: "SCHEDULE_CHANGE", label: "Schedule Changes" },
                  { value: "CITY_CHANGE", label: "Tour Stop Changes" },
                  { value: "DATA_EXPORT", label: "Data Exports" },
                  { value: "AUTH_LOGIN", label: "Logins" },
                  { value: "AUTH_LOGOUT", label: "Logouts" },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp (UTC)</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[#9E9EAF]">
                    <ShieldCheck className="h-8 w-8 mx-auto text-[#6B6B7E] mb-2" />
                    <p className="font-medium text-white">No audit records match criteria</p>
                    <p className="text-xs">Administrative actions will automatically log here.</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-[#9E9EAF]">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {log.adminEmail}
                        </span>
                        <span className="text-[10px] text-[#D4AF37] font-mono">
                          {log.adminRole}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{getActionBadge(log.action)}</TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-white">{log.entityTable}</span>
                        <span className="text-[10px] text-[#6B6B7E] font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[280px]">
                      <span className="text-xs text-[#9E9EAF] truncate block">
                        {log.details || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectedLog(log)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Diff
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Inspect Log Modal */}
      {inspectedLog && (
        <Modal
          isOpen={!!inspectedLog}
          onClose={() => setInspectedLog(null)}
          title={`Audit Entry — ${inspectedLog.action}`}
          description={`Logged at ${new Date(inspectedLog.createdAt).toUTCString()}`}
        >
          <div className="space-y-4 text-xs">
            {/* Operator Box */}
            <div className="p-3 bg-[#0E0E12] rounded border border-[#1E1E28] grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#6B6B7E] block">Operator Email:</span>
                <span className="text-white font-medium">{inspectedLog.adminEmail}</span>
              </div>
              <div>
                <span className="text-[#6B6B7E] block">Role:</span>
                <span className="text-[#D4AF37] font-mono font-semibold">
                  {inspectedLog.adminRole}
                </span>
              </div>
              <div>
                <span className="text-[#6B6B7E] block">Target Table:</span>
                <span className="text-white font-mono">{inspectedLog.entityTable}</span>
              </div>
              <div>
                <span className="text-[#6B6B7E] block">Entity ID:</span>
                <span className="text-white font-mono">{inspectedLog.entityId}</span>
              </div>
            </div>

            {inspectedLog.details && (
              <div className="p-3 bg-[#16161D] rounded border border-[#2A2A38]">
                <span className="text-[#D4AF37] font-semibold block mb-0.5">Details:</span>
                <p className="text-white">{inspectedLog.details}</p>
              </div>
            )}

            {/* State Diffs */}
            {inspectedLog.oldState && (
              <div>
                <span className="font-mono text-[#9E9EAF] uppercase tracking-wider block mb-1">
                  Previous State Snapshot
                </span>
                <pre className="p-3 bg-[#0A0A0E] text-[#9E9EAF] font-mono text-[11px] rounded border border-[#1E1E28] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectedLog.oldState, null, 2)}
                </pre>
              </div>
            )}

            {inspectedLog.newState && (
              <div>
                <span className="font-mono text-[#D4AF37] uppercase tracking-wider block mb-1">
                  New State Snapshot
                </span>
                <pre className="p-3 bg-[#0A0A0E] text-[#10B981] font-mono text-[11px] rounded border border-[#1E1E28] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectedLog.newState, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
