"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Download,
  CalendarClock,
  Eye,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
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
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  getAdminRegistrationsAction,
  updateRegistrationStatusAction,
  exportRegistrationsCsvAction,
  getAdminCitiesAction,
} from "@/app/actions/admin";
import type { EnrichedRegistration } from "@/lib/services/operations-service";
import type { City, RegistrationStatus } from "@/types/database";
import Link from "next/link";

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile Inspection Modal
  const [selectedFan, setSelectedFan] = useState<EnrichedRegistration | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // CSV Export state
  const [isExporting, setIsExporting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [regsRes, citiesRes] = await Promise.all([
      getAdminRegistrationsAction({
        search: searchQuery || undefined,
        cityId: selectedCity !== "all" ? selectedCity : undefined,
        status: selectedStatus !== "all" ? (selectedStatus as RegistrationStatus) : undefined,
      }),
      getAdminCitiesAction(),
    ]);

    if (regsRes.success && regsRes.data) {
      setRegistrations(regsRes.data);
    } else {
      setErrorMessage(regsRes.error || "Failed to load registrations.");
    }

    if (citiesRes.success && citiesRes.data) {
      setCities(citiesRes.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusChange = async (regId: string, newStatus: RegistrationStatus) => {
    setIsUpdatingStatus(true);
    setErrorMessage(null);

    const res = await updateRegistrationStatusAction(regId, newStatus);
    if (res.success && res.data) {
      setSuccessMessage(res.message || "Status updated.");
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? res.data! : r))
      );
      if (selectedFan?.id === regId) {
        setSelectedFan(res.data);
      }
    } else {
      setErrorMessage(res.error || "Failed to update status.");
    }
    setIsUpdatingStatus(false);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    const res = await exportRegistrationsCsvAction({
      cityId: selectedCity !== "all" ? selectedCity : undefined,
      status: selectedStatus !== "all" ? (selectedStatus as RegistrationStatus) : undefined,
    });

    if (res.success && res.data) {
      // Trigger client file download
      const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage("CSV report downloaded successfully.");
    } else {
      setErrorMessage(res.error || "Failed to export CSV.");
    }
    setIsExporting(false);
  };

  return (
    <AdminShell
      title="Fan Registrations Roster"
      subtitle="Triage VIP submissions, inspect attendee details, and manage tour guest attendance."
    >
      <div className="space-y-6">
        {/* Feedback Alerts */}
        {errorMessage && (
          <Alert variant="error" title="Notice">
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9E9EAF]">
              Showing <strong className="text-white">{registrations.length}</strong> VIP registrations
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isExporting ? "Generating CSV..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <form onSubmit={handleSearchSubmit} className="sm:col-span-6 flex gap-2">
              <Input
                placeholder="Search by fan name, email, or tracking code..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="primary" size="sm" className="shrink-0">
                Search
              </Button>
            </form>

            <div className="sm:col-span-3">
              <Select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                options={[
                  { value: "all", label: "All Tour Stops" },
                  ...cities.map((c) => ({
                    value: c.id,
                    label: `${c.name}, ${c.state}`,
                  })),
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: "all", label: "All Attendance Statuses" },
                  { value: "REGISTERED", label: "Registered" },
                  { value: "SCHEDULE_PENDING", label: "Schedule Pending" },
                  { value: "SCHEDULED", label: "Scheduled" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIP Attendee</TableHead>
                <TableHead>Tour Stop</TableHead>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Attendance Status</TableHead>
                <TableHead>Fan Card</TableHead>
                <TableHead>Call Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[#9E9EAF]">
                    <Users className="h-8 w-8 mx-auto text-[#6B6B7E] mb-2" />
                    <p className="font-medium text-white">No registrations found</p>
                    <p className="text-xs">Adjust your search or tour stop filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {reg.fan.first_name} {reg.fan.last_name}
                        </span>
                        <span className="text-xs text-[#9E9EAF]">{reg.fan.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">
                          {reg.city?.name}, {reg.city?.state}
                        </span>
                        <span className="text-[11px] text-[#6B6B7E]">
                          {new Date(`${reg.city?.tour_date}T12:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-[#D4AF37]">
                        {reg.fanCard?.tracking_code || "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusIndicator type="registration" status={reg.status} />
                    </TableCell>

                    <TableCell>
                      {reg.fanCard ? (
                        <StatusIndicator type="fan_card" status={reg.fanCard.current_status} />
                      ) : (
                        <span className="text-xs text-[#6B6B7E]">Pending</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-mono text-[#9E9EAF]">
                        {reg.schedule?.arrival_time || "Pending"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFan(reg)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Details
                        </Button>
                        <Link href={`/admin/schedules?highlight=${reg.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
                          >
                            Schedule
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Fan Details Modal */}
      {selectedFan && (
        <Modal
          isOpen={!!selectedFan}
          onClose={() => setSelectedFan(null)}
          title={`Attendee Profile — ${selectedFan.fan.first_name} ${selectedFan.fan.last_name}`}
          description={`Registered for ${selectedFan.city?.name}, ${selectedFan.city?.state} VIP Meet & Greet`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9E9EAF]">Update Status:</span>
                <select
                  value={selectedFan.status}
                  onChange={(e) =>
                    handleStatusChange(selectedFan.id, e.target.value as RegistrationStatus)
                  }
                  disabled={isUpdatingStatus}
                  className="text-xs bg-[#1A1A24] border border-[#2A2A38] text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="REGISTERED">Registered</option>
                  <option value="SCHEDULE_PENDING">Schedule Pending</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <Button variant="outline" onClick={() => setSelectedFan(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-sm">
            {/* Contact Info Box */}
            <div className="p-4 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                Contact & Shipping Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#9E9EAF]">
                  <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-white font-medium">{selectedFan.fan.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9E9EAF]">
                  <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-white font-medium">{selectedFan.fan.phone_number}</span>
                </div>
              </div>
              <div className="pt-2 text-xs text-[#9E9EAF]">
                <span className="block text-[#6B6B7E]">Fan Card Delivery Address:</span>
                <span className="text-white">
                  {selectedFan.fan.shipping_address_line1}, {selectedFan.fan.shipping_city},{" "}
                  {selectedFan.fan.shipping_state} {selectedFan.fan.shipping_postal_code}
                </span>
              </div>
            </div>

            {/* Tour & Schedule Box */}
            <div className="p-4 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                  Meet & Greet Schedule
                </h4>
                <Link
                  href={`/admin/schedules?registrationId=${selectedFan.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D4AF37] hover:underline"
                >
                  <CalendarClock className="h-3 w-3" />
                  {selectedFan.schedule ? "Manage Schedule →" : "Assign Schedule →"}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[#6B6B7E]">Tour Stop:</span>
                  <span className="text-white font-medium">
                    {selectedFan.city?.name} ({selectedFan.city?.tour_date})
                  </span>
                </div>
                <div>
                  <span className="block text-[#6B6B7E]">Call Time:</span>
                  <span className="text-white font-medium">
                    {selectedFan.schedule?.arrival_time || "Not yet assigned"}
                  </span>
                </div>
              </div>
              {selectedFan.schedule?.arrival_instructions && (
                <div className="text-xs text-[#D4AF37]/90 bg-[#16161D] p-2.5 rounded border border-[#2A2A38]">
                  <span className="font-semibold block mb-0.5">Assigned Entrance Instructions:</span>
                  {selectedFan.schedule.arrival_instructions}
                </div>
              )}
            </div>

            {/* Fan Card Logistics */}
            <div className="p-4 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                Physical Fan Card
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[#6B6B7E]">Tracking Code:</span>
                  <span className="font-mono text-[#D4AF37] font-bold">
                    {selectedFan.fanCard?.tracking_code}
                  </span>
                </div>
                <div>
                  <span className="block text-[#6B6B7E]">Current Fulfillment State:</span>
                  <span className="text-white font-medium">
                    {selectedFan.fanCard?.current_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {selectedFan.special_notes && (
              <div className="text-xs p-3 rounded bg-[#16161D] border border-[#2A2A38] text-[#9E9EAF]">
                <span className="font-semibold text-white block mb-1">Fan Notes / Requests:</span>
                &ldquo;{selectedFan.special_notes}&rdquo;
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
