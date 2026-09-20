"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  MapPin,
  Building,
  AlertCircle,
  History,
  Edit3,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Info,
  Send,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card } from "@/components/ui/Card";
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
import { Badge } from "@/components/ui/Badge";
import {
  getAdminRegistrationsAction,
  getAdminCitiesAction,
  createScheduleAction,
  updateScheduleAction,
  cancelScheduleAction,
  getScheduleHistoryAction,
} from "@/app/actions/admin";
import type { EnrichedRegistration, StoredScheduleEntity } from "@/lib/services/operations-service";
import type { City, ScheduleHistoryEntry, ScheduleStatus } from "@/types/database";

function SchedulesContent() {
  const searchParams = useSearchParams();
  const urlRegId = searchParams.get("registrationId");

  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "awaiting" | "scheduled" | "completed" | "cancelled">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // ---------------------------------------------------------------------------
  // Modal states
  // ---------------------------------------------------------------------------
  // 1. Create Schedule Wizard Modal
  const [createReg, setCreateReg] = useState<EnrichedRegistration | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("17:30");
  const [formEndTime, setFormEndTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formSendEmail, setFormSendEmail] = useState(true);

  // 2. Edit Schedule Modal
  const [editingSchedule, setEditingSchedule] = useState<StoredScheduleEntity | null>(null);
  const [editReg, setEditReg] = useState<EnrichedRegistration | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editStatus, setEditStatus] = useState<ScheduleStatus>("SCHEDULED");
  const [editChangeReason, setEditChangeReason] = useState("");
  const [editSendEmail, setEditSendEmail] = useState(true);

  // 3. Cancel Schedule Modal
  const [cancellingSchedule, setCancellingSchedule] = useState<StoredScheduleEntity | null>(null);
  const [cancelReg, setCancelReg] = useState<EnrichedRegistration | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSendEmail, setCancelSendEmail] = useState(true);

  // 4. Schedule History Modal
  const [viewHistorySchedule, setViewHistorySchedule] = useState<StoredScheduleEntity | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ScheduleHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [regsRes, citiesRes] = await Promise.all([
      getAdminRegistrationsAction({
        search: searchQuery || undefined,
        cityId: selectedCity !== "all" ? selectedCity : undefined,
      }),
      getAdminCitiesAction(),
    ]);

    if (regsRes.success && regsRes.data) {
      setRegistrations(regsRes.data);

      // Auto-open modal if URL has registrationId query param
      if (urlRegId) {
        const found = regsRes.data.find((r) => r.id === urlRegId);
        if (found) {
          if (found.schedule && found.schedule.status !== "CANCELLED") {
            handleOpenEditModal(found);
          } else {
            handleOpenCreateModal(found);
          }
        }
      }
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
  }, [selectedCity]);

  // ---------------------------------------------------------------------------
  // Open Modals Handlers
  // ---------------------------------------------------------------------------
  const handleOpenCreateModal = (reg: EnrichedRegistration) => {
    setCreateReg(reg);
    setCreateStep(1);
    setFormDate(reg.city?.tour_date || "");
    setFormStartTime("17:30");
    setFormEndTime("18:30");
    setFormLocation(
      reg.city?.venue_name
        ? `${reg.city.venue_name} - VIP Green Room, Stage Door B`
        : "Main Tour Venue - VIP Lounge"
    );
    setFormInstructions(
      `Please arrive promptly at your assigned call time. Present a valid government-issued photo ID and your physical Fan Card at Stage Door B. Kountry Wayne will meet guests in the private green room.`
    );
    setFormSendEmail(true);
  };

  const handleOpenEditModal = (reg: EnrichedRegistration) => {
    if (!reg.schedule) return;
    setEditReg(reg);
    setEditingSchedule(reg.schedule);
    setEditDate(reg.schedule.date || reg.schedule.assigned_date || "");
    setEditStartTime(reg.schedule.start_time || reg.schedule.arrival_time || "17:30");
    setEditEndTime(reg.schedule.end_time || "");
    setEditLocation(reg.schedule.location || reg.schedule.venue_name || "");
    setEditInstructions(
      reg.schedule.instructions || reg.schedule.arrival_instructions || ""
    );
    setEditStatus(reg.schedule.status);
    setEditChangeReason("");
    setEditSendEmail(true);
  };

  const handleOpenCancelModal = (reg: EnrichedRegistration) => {
    if (!reg.schedule) return;
    setCancelReg(reg);
    setCancellingSchedule(reg.schedule);
    setCancelReason("");
    setCancelSendEmail(true);
  };

  const handleOpenHistoryModal = async (schedule: StoredScheduleEntity) => {
    setViewHistorySchedule(schedule);
    setIsLoadingHistory(true);
    const res = await getScheduleHistoryAction(schedule.id);
    if (res.success && res.data) {
      setHistoryEntries(res.data);
    } else {
      setHistoryEntries(schedule.history || []);
    }
    setIsLoadingHistory(false);
  };

  // ---------------------------------------------------------------------------
  // Actions Submission Handlers
  // ---------------------------------------------------------------------------
  const handleCreateScheduleSubmit = () => {
    if (!createReg) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await createScheduleAction({
        registrationId: createReg.id,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime || null,
        location: formLocation,
        instructions: formInstructions,
        sendEmail: formSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || "VIP schedule successfully confirmed.");
        setCreateReg(null);
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to create schedule.");
      }
    });
  };

  const handleUpdateScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateScheduleAction(editingSchedule.id, {
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime || null,
        location: editLocation,
        instructions: editInstructions,
        status: editStatus,
        changeReason: editChangeReason.trim() || undefined,
        sendEmail: editSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || "VIP schedule updated successfully.");
        setEditingSchedule(null);
        setEditReg(null);
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to update schedule.");
      }
    });
  };

  const handleCancelScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSchedule) return;

    if (!cancelReason.trim()) {
      setErrorMessage("Please enter a mandatory cancellation reason.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await cancelScheduleAction(cancellingSchedule.id, {
        cancellationReason: cancelReason.trim(),
        sendEmail: cancelSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || "VIP schedule has been cancelled.");
        setCancellingSchedule(null);
        setCancelReg(null);
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to cancel schedule.");
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Filter registrations
  // ---------------------------------------------------------------------------
  const filteredRegistrations = registrations.filter((reg) => {
    const sched = reg.schedule;
    if (statusFilter === "awaiting") {
      return !sched || sched.status === "PENDING";
    }
    if (statusFilter === "scheduled") {
      return sched && sched.status === "SCHEDULED";
    }
    if (statusFilter === "completed") {
      return sched && sched.status === "COMPLETED";
    }
    if (statusFilter === "cancelled") {
      return sched && sched.status === "CANCELLED";
    }
    return true;
  });

  const countAwaiting = registrations.filter(
    (r) => !r.schedule || r.schedule.status === "PENDING"
  ).length;
  const countScheduled = registrations.filter((r) => r.schedule?.status === "SCHEDULED").length;
  const countCompleted = registrations.filter((r) => r.schedule?.status === "COMPLETED").length;
  const countCancelled = registrations.filter((r) => r.schedule?.status === "CANCELLED").length;

  return (
    <AdminShell
      title="Meet & Greet VIP Schedules"
      subtitle="Tour administration controls all appointments. Fans never select dates or times. Assign call times, set stage-door access, preserve revision history, and dispatch confidential VIP itinerary emails."
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

        {/* Top Control Bar with Segment Filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap rounded-lg bg-[#111115] border border-[#2A2A38] p-1 gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === "all"
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-[#9E9EAF] hover:text-white"
              }`}
            >
              All VIPs ({registrations.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("awaiting")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === "awaiting"
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-[#9E9EAF] hover:text-white"
              }`}
            >
              Awaiting Schedule ({countAwaiting})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("scheduled")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === "scheduled"
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-[#9E9EAF] hover:text-white"
              }`}
            >
              Confirmed Scheduled ({countScheduled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === "completed"
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-[#9E9EAF] hover:text-white"
              }`}
            >
              Completed ({countCompleted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === "cancelled"
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-[#9E9EAF] hover:text-white"
              }`}
            >
              Cancelled ({countCancelled})
            </button>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 flex gap-2">
              <Input
                placeholder="Search VIP by fan name, email, or tracking code..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={loadData}
                className="shrink-0"
              >
                Filter
              </Button>
            </div>

            <div className="sm:col-span-4">
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
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIP Attendee</TableHead>
                <TableHead>Tour Stop</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Call Time Window</TableHead>
                <TableHead>Location & Door</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Notice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[#9E9EAF]">
                    <CalendarClock className="h-8 w-8 mx-auto text-[#6B6B7E] mb-2" />
                    <p className="font-medium text-white">No schedules match the selected filter</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((reg) => {
                  const sched = reg.schedule;
                  const hasActiveSchedule = sched && sched.status !== "CANCELLED";

                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {reg.fan.first_name} {reg.fan.last_name}
                          </span>
                          <span className="text-xs text-[#9E9EAF]">{reg.fan.email}</span>
                          {reg.fanCard?.tracking_code && (
                            <span className="text-[10px] font-mono text-[#D4AF37]/80">
                              {reg.fanCard.tracking_code}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-white">
                            {reg.city?.name}, {reg.city?.state}
                          </span>
                          <span className="text-[11px] text-[#6B6B7E]">
                            {reg.city?.venue_name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-mono text-white">
                          {sched?.date || sched?.assigned_date
                            ? new Date(`${sched.date || sched.assigned_date}T12:00:00`).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        {sched?.start_time || sched?.arrival_time ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#F3E5AB] font-mono text-xs font-bold border border-[#D4AF37]/30">
                            <Clock className="h-3 w-3 text-[#D4AF37]" />
                            <span>{sched.start_time || sched.arrival_time}</span>
                            {sched.end_time && (
                              <span className="text-[#9E9EAF] font-normal">
                                – {sched.end_time}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/25">
                            <AlertCircle className="h-3 w-3" /> Awaiting Call Time
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[180px]">
                        {sched?.location || sched?.venue_name ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-white truncate">
                              {sched.location || sched.venue_name}
                            </span>
                            <span className="text-[11px] text-[#9E9EAF] truncate">
                              {sched.instructions || sched.arrival_instructions}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B6B7E]">Unassigned</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {sched ? (
                          sched.status === "SCHEDULED" ? (
                            <Badge variant="success" size="sm" dot>
                              SCHEDULED
                            </Badge>
                          ) : sched.status === "COMPLETED" ? (
                            <Badge variant="neutral" size="sm">
                              COMPLETED
                            </Badge>
                          ) : sched.status === "CANCELLED" ? (
                            <Badge variant="error" size="sm" dot>
                              CANCELLED
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm" dot>
                              PENDING
                            </Badge>
                          )
                        ) : (
                          <Badge variant="warning" size="sm" dot>
                            UNSCHEDULED
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {sched?.is_notified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30">
                            <CheckCircle2 className="h-3 w-3" /> Dispatched
                          </span>
                        ) : sched ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-[#9E9EAF] bg-[#1F1F28] border border-[#2A2A38]">
                            <Mail className="h-3 w-3" /> Not Sent
                          </span>
                        ) : (
                          <span className="text-xs text-[#6B6B7E]">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasActiveSchedule ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(reg)}
                                title="Edit Schedule Details"
                                leftIcon={<Edit3 className="h-3 w-3" />}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenHistoryModal(sched)}
                                title="View Revision History"
                                className="text-[#9E9EAF] hover:text-white"
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenCancelModal(reg)}
                                title="Cancel Schedule"
                                className="text-[#EF4444] hover:bg-[#EF4444]/10"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenCreateModal(reg)}
                              leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
                            >
                              Assign Schedule
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 1. Multi-Step Schedule Creation Wizard Modal                          */}
      {/* ===================================================================== */}
      {createReg && (
        <Modal
          isOpen={!!createReg}
          onClose={() => setCreateReg(null)}
          title={`Create Meet & Greet Schedule — ${createReg.fan.first_name} ${createReg.fan.last_name}`}
          description={`Tour Stop: ${createReg.city?.name}, ${createReg.city?.state} (${createReg.city?.venue_name || "Tour Venue"})`}
        >
          <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between border-b border-[#1E1E28] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full font-mono text-xs font-bold ${
                    createStep === 1
                      ? "bg-[#D4AF37] text-black"
                      : "bg-[#10B981] text-white"
                  }`}
                >
                  {createStep === 1 ? "1" : "✓"}
                </span>
                <span className={createStep === 1 ? "text-white font-semibold" : "text-[#9E9EAF]"}>
                  Enter Schedule Coordinates
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6B6B7E]" />
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full font-mono text-xs font-bold ${
                    createStep === 2
                      ? "bg-[#D4AF37] text-black"
                      : "bg-[#1E1E28] text-[#9E9EAF]"
                  }`}
                >
                  2
                </span>
                <span className={createStep === 2 ? "text-white font-semibold" : "text-[#9E9EAF]"}>
                  Review & Confirm
                </span>
              </div>
            </div>

            {/* STEP 1: Details Entry */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Meet & Greet Date (YYYY-MM-DD)"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                  <Input
                    label="VIP Arrival / Call Time"
                    placeholder="e.g. 5:30 PM or 17:30"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Optional End / Departure Time"
                    placeholder="e.g. 6:30 PM (optional)"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                  />
                  <Input
                    label="Exact Meeting Location / Green Room"
                    placeholder="e.g. Fox Theatre - VIP Green Room, Stage Door B"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF] block">
                    Confidential Stage Door & Entrance Instructions
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    className="w-full text-xs bg-[#0E0E12] border border-[#2A2A38] text-white rounded-lg p-2.5 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Enter confidential security instructions and check-in details..."
                  />
                  <p className="text-[11px] text-[#6B6B7E]">
                    Fans cannot choose their own schedule. These details will be communicated directly via email.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="create_send_email"
                    checked={formSendEmail}
                    onChange={(e) => setFormSendEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <label htmlFor="create_send_email" className="text-xs text-[#F8F8FC]">
                    Dispatch VIP Schedule confirmation email to <strong>{createReg.fan.email}</strong>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateReg(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!formDate || !formStartTime || !formLocation || !formInstructions}
                    onClick={() => setCreateStep(2)}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Next: Review Schedule
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Review & Confirmation Summary Screen */}
            {createStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0E0E12] border border-[#D4AF37]/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E1E28] pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-semibold">
                      VIP Itinerary Review Summary
                    </span>
                    <Badge variant="default" size="sm">
                      Ready for Confirmation
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#6B6B7E] block text-[11px]">VIP Attendee:</span>
                      <span className="text-white font-medium">
                        {createReg.fan.first_name} {createReg.fan.last_name}
                      </span>
                      <span className="text-[#9E9EAF] block text-[11px]">{createReg.fan.email}</span>
                    </div>

                    <div>
                      <span className="text-[#6B6B7E] block text-[11px]">Tour Stop:</span>
                      <span className="text-white font-medium">
                        {createReg.city?.name}, {createReg.city?.state}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#6B6B7E] block text-[11px]">Assigned Date:</span>
                      <span className="text-white font-mono font-medium">
                        {new Date(`${formDate}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#6B6B7E] block text-[11px]">Call Time Window:</span>
                      <span className="text-[#F3E5AB] font-mono font-bold">
                        {formStartTime} {formEndTime ? `– ${formEndTime}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs pt-1">
                    <span className="text-[#6B6B7E] block text-[11px]">VIP Location:</span>
                    <span className="text-white font-medium">{formLocation}</span>
                  </div>

                  <div className="text-xs bg-[#16161D] p-3 rounded border border-[#2A2A38] space-y-1">
                    <span className="text-[#D4AF37] font-semibold block text-[11px]">
                      Security & Entrance Directions:
                    </span>
                    <p className="text-[#E2E8F0] leading-relaxed">{formInstructions}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-[#9E9EAF]">
                    <Mail className="h-4 w-4 text-[#D4AF37]" />
                    <span>
                      {formSendEmail ? (
                        <>Email dispatch: <strong>Instant itinerary email</strong> will be sent to {createReg.fan.email}</>
                      ) : (
                        <span className="text-[#F59E0B]">Email dispatch: Disabled (internal record only)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1E1E28]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateStep(1)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    disabled={isPending}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateScheduleSubmit}
                    disabled={isPending}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    {isPending ? "Confirming & Saving..." : "Confirm & Save Schedule"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 2. Edit Schedule Modal (with Change Reason & Diffs)                    */}
      {/* ===================================================================== */}
      {editingSchedule && editReg && (
        <Modal
          isOpen={!!editingSchedule}
          onClose={() => {
            setEditingSchedule(null);
            setEditReg(null);
          }}
          title={`Edit VIP Schedule — ${editReg.fan.first_name} ${editReg.fan.last_name}`}
          description={`Tour Stop: ${editReg.city?.name}, ${editReg.city?.state}`}
        >
          <form onSubmit={handleUpdateScheduleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Meet & Greet Date"
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              <Input
                label="Arrival / Call Time"
                required
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="End Time (optional)"
                placeholder="e.g. 18:30"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
              <Select
                label="Schedule Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ScheduleStatus)}
                options={[
                  { value: "SCHEDULED", label: "SCHEDULED" },
                  { value: "PENDING", label: "PENDING" },
                  { value: "COMPLETED", label: "COMPLETED" },
                  { value: "CANCELLED", label: "CANCELLED" },
                ]}
              />
            </div>

            <Input
              label="Meeting Location"
              required
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF] block">
                Arrival & Entrance Instructions
              </label>
              <textarea
                rows={3}
                required
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                className="w-full text-xs bg-[#0E0E12] border border-[#2A2A38] text-white rounded-lg p-2.5 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Revision Reason (Preserved in History) */}
            <div className="space-y-1.5 p-3 rounded bg-[#16161D] border border-[#2A2A38]">
              <label className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] block font-semibold">
                Reason for Schedule Revision (Saved to Audit History)
              </label>
              <Input
                placeholder="e.g. Sound check delay, venue gate door change..."
                value={editChangeReason}
                onChange={(e) => setEditChangeReason(e.target.value)}
              />
              <p className="text-[11px] text-[#6B6B7E]">
                This explanation will be recorded non-destructively in the VIP schedule timeline and included in fan updates.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit_send_email"
                checked={editSendEmail}
                onChange={(e) => setEditSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <label htmlFor="edit_send_email" className="text-xs text-[#F8F8FC]">
                Dispatch Schedule Update notification email to <strong>{editReg.fan.email}</strong>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingSchedule(null);
                  setEditReg(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Saving Revision..." : "Save Revision & History"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 3. Cancel Schedule Modal (with Mandatory Reason)                      */}
      {/* ===================================================================== */}
      {cancellingSchedule && cancelReg && (
        <Modal
          isOpen={!!cancellingSchedule}
          onClose={() => {
            setCancellingSchedule(null);
            setCancelReg(null);
          }}
          title={`Cancel VIP Schedule — ${cancelReg.fan.first_name} ${cancelReg.fan.last_name}`}
          description={`Tour Stop: ${cancelReg.city?.name}, ${cancelReg.city?.state}`}
        >
          <form onSubmit={handleCancelScheduleSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#F87171] space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Schedule Cancellation Warning
              </span>
              <p>
                Cancelling this VIP appointment will mark the schedule as CANCELLED, preserve the cancellation reason in the audit ledger, and notify the fan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#EF4444] block font-semibold">
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain why this VIP schedule is being cancelled (e.g. tour routing adjustment, security reschedule)..."
                className="w-full text-xs bg-[#0E0E12] border border-[#EF4444]/40 text-white rounded-lg p-2.5 focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="cancel_send_email"
                checked={cancelSendEmail}
                onChange={(e) => setCancelSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#EF4444] focus:ring-[#EF4444]"
              />
              <label htmlFor="cancel_send_email" className="text-xs text-[#F8F8FC]">
                Dispatch cancellation notice email to <strong>{cancelReg.fan.email}</strong>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCancellingSchedule(null);
                  setCancelReg(null);
                }}
                disabled={isPending}
              >
                Go Back
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isPending || cancelReason.trim().length < 5}
                className="border-[#EF4444]/50 text-[#EF4444] hover:bg-[#EF4444]/20"
              >
                {isPending ? "Cancelling..." : "Confirm Schedule Cancellation"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 4. Schedule Revision History Modal                                    */}
      {/* ===================================================================== */}
      {viewHistorySchedule && (
        <Modal
          isOpen={!!viewHistorySchedule}
          onClose={() => setViewHistorySchedule(null)}
          title="Schedule Revision History Ledger"
          description={`Schedule ID: ${viewHistorySchedule.id} • Status: ${viewHistorySchedule.status}`}
        >
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="py-10 text-center text-xs text-[#9E9EAF]">
                <RefreshCw className="h-5 w-5 mx-auto animate-spin mb-2 text-[#D4AF37]" />
                Loading revision ledger...
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9E9EAF]">
                No revision entries recorded for this schedule.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {historyEntries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.action === "CREATED"
                              ? "success"
                              : entry.action === "CANCELLED"
                              ? "error"
                              : entry.action === "STATUS_CHANGE"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {entry.action}
                        </Badge>
                        <span className="font-semibold text-white">
                          {entry.changed_by_name || entry.changed_by}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#6B6B7E]">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>

                    {entry.change_reason && (
                      <div className="text-[11px] text-[#D4AF37]/90 bg-[#16161D] p-2 rounded border border-[#2A2A38]">
                        <span className="font-semibold block text-[#9E9EAF] text-[10px] uppercase">
                          Reason:
                        </span>
                        {entry.change_reason}
                      </div>
                    )}

                    {/* Diff Display */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      {entry.previous_values && (
                        <div className="p-2 rounded bg-[#1F1414] border border-[#EF4444]/20 text-[#EF4444]">
                          <span className="block font-bold text-[10px] uppercase text-[#F87171]">
                            Previous:
                          </span>
                          <div>Date: {entry.previous_values.date || "—"}</div>
                          <div>Call: {entry.previous_values.start_time || "—"}</div>
                          <div>Status: {entry.previous_values.status || "—"}</div>
                        </div>
                      )}
                      <div
                        className={`p-2 rounded bg-[#10241B] border border-[#10B981]/20 text-[#34D399] ${
                          !entry.previous_values ? "col-span-2" : ""
                        }`}
                      >
                        <span className="block font-bold text-[10px] uppercase text-[#34D399]">
                          {entry.previous_values ? "Updated Values:" : "Initial Schedule:"}
                        </span>
                        <div>Date: {entry.new_values.date}</div>
                        <div>Call: {entry.new_values.start_time}</div>
                        <div>Status: {entry.new_values.status}</div>
                        {entry.new_values.location && (
                          <div className="truncate">Loc: {entry.new_values.location}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#6B6B7E] border-t border-[#1E1E28]">
                      <span>Fan notified via email:</span>
                      <span className={entry.notified_fan ? "text-[#10B981]" : "text-[#9E9EAF]"}>
                        {entry.notified_fan ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#1E1E28]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewHistorySchedule(null)}
              >
                Close Ledger
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

export default function AdminSchedulesPage() {
  return (
    <Suspense
      fallback={
        <AdminShell
          title="Meet & Greet VIP Schedules"
          subtitle="Loading Meet & Greet scheduling console..."
        >
          <div className="py-20 text-center text-xs text-[#9E9EAF]">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-[#D4AF37]" />
            Loading schedules...
          </div>
        </AdminShell>
      }
    >
      <SchedulesContent />
    </Suspense>
  );
}
