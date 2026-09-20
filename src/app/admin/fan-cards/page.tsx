"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import {
  CreditCard,
  Search,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Send,
  User,
  MapPin,
  Calendar,
  Clock,
  Mail,
  History,
  Info,
  ChevronRight,
  ArrowRight,
  Package,
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
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminFanCardsAction,
  updateFanCardStatusAction,
  batchUpdateFanCardStatusAction,
  resendFanCardTrackingEmailAction,
  getAdminRegistrationsAction,
  getAdminCitiesAction,
} from "@/app/actions/admin";
import type { StoredFanCardEntity, EnrichedRegistration } from "@/lib/services/operations-service";
import type { City, FanCardStatus } from "@/types/database";
import Link from "next/link";

const STAGES: Array<{ status: FanCardStatus; label: string }> = [
  { status: "REGISTERED", label: "Registered" },
  { status: "PROCESSING", label: "Processing" },
  { status: "PREPARED", label: "Prepared" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "IN_TRANSIT", label: "In Transit" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
  { status: "DELIVERY_ISSUE", label: "Delivery Issue" },
];

function FanCardsContent() {
  const [cards, setCards] = useState<StoredFanCardEntity[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, EnrichedRegistration>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Comprehensive "Open Fan Card" Modal State
  const [detailCard, setDetailCard] = useState<StoredFanCardEntity | null>(null);
  const [detailTargetStatus, setDetailTargetStatus] = useState<FanCardStatus>("PROCESSING");
  const [detailCourierRef, setDetailCourierRef] = useState("");
  const [detailInternalNotes, setDetailInternalNotes] = useState("");
  const [detailSendEmail, setDetailSendEmail] = useState(true);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // 2. Single Quick Advance Modal State
  const [advanceCard, setAdvanceCard] = useState<StoredFanCardEntity | null>(null);
  const [advanceTargetStatus, setAdvanceTargetStatus] = useState<FanCardStatus>("PROCESSING");
  const [advanceCourierRef, setAdvanceCourierRef] = useState("");
  const [advanceInternalNotes, setAdvanceInternalNotes] = useState("");
  const [advanceSendEmail, setAdvanceSendEmail] = useState(true);

  // 3. Issue Flag Modal State
  const [issueModalCard, setIssueModalCard] = useState<StoredFanCardEntity | null>(null);
  const [issueReason, setIssueReason] = useState("");
  const [issueSendEmail, setIssueSendEmail] = useState(true);

  // 4. Batch Advance Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetStatus, setBatchTargetStatus] = useState<FanCardStatus>("PREPARED");
  const [batchCourierRef, setBatchCourierRef] = useState("");
  const [batchInternalNotes, setBatchInternalNotes] = useState("");
  const [batchSendEmail, setBatchSendEmail] = useState(true);

  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [cardsRes, regsRes, citiesRes] = await Promise.all([
      getAdminFanCardsAction({
        status: selectedStatus !== "all" ? (selectedStatus as FanCardStatus) : undefined,
        cityId: selectedCity !== "all" ? selectedCity : undefined,
      }),
      getAdminRegistrationsAction(),
      getAdminCitiesAction(),
    ]);

    if (cardsRes.success && cardsRes.data) {
      setCards(cardsRes.data);
      // Keep detailCard fresh if currently open
      if (detailCard) {
        const refreshed = cardsRes.data.find((c) => c.id === detailCard.id);
        if (refreshed) setDetailCard(refreshed);
      }
    } else {
      setErrorMessage(cardsRes.error || "Failed to load Fan Cards.");
    }

    if (regsRes.success && regsRes.data) {
      const regMap: Record<string, EnrichedRegistration> = {};
      for (const r of regsRes.data) {
        regMap[r.id] = r;
      }
      setRegistrations(regMap);
    }

    if (citiesRes.success && citiesRes.data) {
      setCities(citiesRes.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCity]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCardIds(filteredCards.map((c) => c.id));
    } else {
      setSelectedCardIds([]);
    }
  };

  const handleToggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Full Detail Modal
  const handleOpenDetailModal = (card: StoredFanCardEntity) => {
    setDetailCard(card);
    // Suggest next logical status
    const currentIndex = STAGES.findIndex((s) => s.status === card.current_status);
    const nextStage =
      currentIndex >= 0 && currentIndex < 6
        ? STAGES[currentIndex + 1].status
        : card.current_status;
    setDetailTargetStatus(nextStage);
    setDetailCourierRef(card.courier_reference || "");
    setDetailInternalNotes("");
    setDetailSendEmail(true);
  };

  // Open Quick Advance Modal
  const handleOpenQuickAdvance = (card: StoredFanCardEntity) => {
    setAdvanceCard(card);
    const currentIndex = STAGES.findIndex((s) => s.status === card.current_status);
    const nextStage =
      currentIndex >= 0 && currentIndex < 6
        ? STAGES[currentIndex + 1].status
        : card.current_status;
    setAdvanceTargetStatus(nextStage);
    setAdvanceCourierRef(card.courier_reference || "");
    setAdvanceInternalNotes("");
    setAdvanceSendEmail(true);
  };

  // Submit Detail Status Change
  const handleSaveDetailStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCard) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateFanCardStatusAction(detailCard.id, detailTargetStatus, {
        courierReference: detailCourierRef.trim() || undefined,
        internalNotes: detailInternalNotes.trim() || undefined,
        sendEmail: detailSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || `Fan Card status advanced to ${detailTargetStatus}.`);
        setDetailCard(res.data);
        setDetailInternalNotes("");
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to update Fan Card status.");
      }
    });
  };

  // Submit Quick Advance
  const handleSaveQuickAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceCard) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateFanCardStatusAction(advanceCard.id, advanceTargetStatus, {
        courierReference: advanceCourierRef.trim() || undefined,
        internalNotes: advanceInternalNotes.trim() || undefined,
        sendEmail: advanceSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || `Fan Card advanced to ${advanceTargetStatus}.`);
        setAdvanceCard(null);
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to advance Fan Card.");
      }
    });
  };

  // Submit Issue Flag
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalCard) return;

    if (!issueReason.trim()) {
      setErrorMessage("Please enter an explanation of the delivery issue.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateFanCardStatusAction(issueModalCard.id, "DELIVERY_ISSUE", {
        issueReason: issueReason.trim(),
        internalNotes: issueReason.trim(),
        sendEmail: issueSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || "Card marked with delivery issue.");
        setIssueModalCard(null);
        setIssueReason("");
        await loadData();
      } else {
        setErrorMessage(res.error || "Failed to flag delivery issue.");
      }
    });
  };

  // Submit Batch Advance
  const handleSaveBatchAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCardIds.length === 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await batchUpdateFanCardStatusAction(selectedCardIds, batchTargetStatus, {
        courierReference: batchCourierRef.trim() || undefined,
        internalNotes: batchInternalNotes.trim() || undefined,
        sendEmail: batchSendEmail,
      });

      if (res.success && res.data) {
        setSuccessMessage(res.message || `Batch update complete.`);
        setIsBatchModalOpen(false);
        setSelectedCardIds([]);
        await loadData();
      } else {
        setErrorMessage(res.error || "Batch update failed.");
      }
    });
  };

  // Resend Tracking Email
  const handleResendTrackingEmail = async (cardId: string) => {
    setIsResendingEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await resendFanCardTrackingEmailAction(cardId);
    if (res.success) {
      setSuccessMessage(res.message || "Tracking email successfully re-sent to fan.");
    } else {
      setErrorMessage(res.error || "Failed to resend tracking email.");
    }
    setIsResendingEmail(false);
  };

  // Search filter
  const filteredCards = cards.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const reg = registrations[c.registration_id];
    const fanName = `${reg?.fan?.first_name || ""} ${reg?.fan?.last_name || ""}`.toLowerCase();
    const email = (reg?.fan?.email || "").toLowerCase();
    const code = c.tracking_code.toLowerCase();
    const courier = (c.courier_reference || "").toLowerCase();
    return code.includes(q) || fanName.includes(q) || email.includes(q) || courier.includes(q);
  });

  return (
    <AdminShell
      title="Fan Card Fulfillment & Lifecycle Management"
      subtitle="Admin-controlled production pipeline, delivery tracking, exception resolution, and non-destructive audit timeline."
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

        {/* Pipeline Stage Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "all"
                ? "bg-[#D4AF37] text-black font-semibold"
                : "bg-[#111115] text-[#9E9EAF] hover:text-white border border-[#2A2A38]"
            }`}
          >
            All Cards ({cards.length})
          </button>
          {STAGES.map((s) => {
            const count = cards.filter((c) => c.current_status === s.status).length;
            return (
              <button
                key={s.status}
                type="button"
                onClick={() => setSelectedStatus(s.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedStatus === s.status
                    ? "bg-[#D4AF37] text-black font-semibold"
                    : "bg-[#111115] text-[#9E9EAF] hover:text-white border border-[#2A2A38]"
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedStatus === s.status
                      ? "bg-black/20 text-black font-bold"
                      : "bg-[#1E1E28] text-[#9E9EAF]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Batch Actions Bar */}
        {selectedCardIds.length > 0 && (
          <div className="p-3 bg-[#1A1A24] border border-[#D4AF37]/40 rounded-lg flex items-center justify-between gap-4 animate-in fade-in">
            <span className="text-xs text-[#F8F8FC] font-medium">
              <strong className="text-[#D4AF37]">{selectedCardIds.length}</strong> Fan Cards selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBatchModalOpen(true)}
                leftIcon={<Layers className="h-3.5 w-3.5" />}
              >
                Bulk Advance ({selectedCardIds.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCardIds([])}
                className="text-xs text-[#9E9EAF]"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}

        {/* Table & Search Card */}
        <Card>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 flex gap-2">
              <Input
                placeholder="Search by tracking code, fan name, or courier ID..."
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

            <div className="sm:col-span-4 flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
                className="shrink-0"
              >
                Refresh
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredCards.length > 0 &&
                      selectedCardIds.length === filteredCards.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                </TableHead>
                <TableHead>Tracking Code</TableHead>
                <TableHead>VIP Recipient</TableHead>
                <TableHead>Tour Stop</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Courier Reference</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[#9E9EAF]">
                    <CreditCard className="h-8 w-8 mx-auto text-[#6B6B7E] mb-2" />
                    <p className="font-medium text-white">No Fan Cards match filter</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCards.map((card) => {
                  const reg = registrations[card.registration_id];
                  const isSelected = selectedCardIds.includes(card.id);

                  return (
                    <TableRow key={card.id} className={isSelected ? "bg-[#D4AF37]/5" : undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectCard(card.id)}
                          className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">
                            {card.tracking_code}
                          </span>
                          <Link
                            href={`/track?code=${card.tracking_code}`}
                            target="_blank"
                            title="View public fan tracking view"
                            className="text-[#6B6B7E] hover:text-[#D4AF37]"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {reg?.fan ? `${reg.fan.first_name} ${reg.fan.last_name}` : "VIP Fan"}
                          </span>
                          <span className="text-xs text-[#9E9EAF]">{reg?.fan?.email}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-white">
                          {reg?.city ? `${reg.city.name}, ${reg.city.state}` : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusIndicator type="fan_card" status={card.current_status} />
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-mono text-[#9E9EAF]">
                          {card.courier_reference || "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-[#6B6B7E]">
                          {new Date(card.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenDetailModal(card)}
                          >
                            Open Card
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQuickAdvance(card)}
                            title="Quick Advance Status"
                          >
                            Advance
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIssueModalCard(card)}
                            className="text-xs text-[#EF4444] hover:bg-[#EF4444]/10"
                            title="Flag delivery exception"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </Button>
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
      {/* 1. Comprehensive "Open Fan Card" Modal (with Related Fan & Reg)       */}
      {/* ===================================================================== */}
      {detailCard && (
        <Modal
          isOpen={!!detailCard}
          onClose={() => setDetailCard(null)}
          title={`Fan Card Fulfillment Dossier — ${detailCard.tracking_code}`}
          description={`Internal UUID: ${detailCard.id} • Registered: ${new Date(detailCard.created_at).toLocaleString()}`}
        >
          {(() => {
            const reg = registrations[detailCard.registration_id];
            return (
              <div className="space-y-5">
                {/* Top Status & Tracking Banner */}
                <div className="p-3.5 rounded-lg bg-[#0E0E12] border border-[#1E1E28] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIndicator type="fan_card" status={detailCard.current_status} />
                    <span className="font-mono text-xs text-[#D4AF37] font-bold">
                      {detailCard.tracking_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendTrackingEmail(detailCard.id)}
                      disabled={isResendingEmail}
                      leftIcon={<Mail className="h-3.5 w-3.5 text-[#D4AF37]" />}
                    >
                      {isResendingEmail ? "Resending..." : "Resend Tracking Email"}
                    </Button>
                    <Link
                      href={`/track?code=${detailCard.tracking_code}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#181820] border border-[#2A2A38] text-xs text-[#9E9EAF] hover:text-white"
                    >
                      <span>Public Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Grid: Related Fan & Related Registration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Related Fan */}
                  <div className="p-3.5 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold text-[11px] uppercase tracking-wider">
                      <User className="h-3.5 w-3.5" />
                      <span>Related Fan Details</span>
                    </div>
                    {reg?.fan ? (
                      <div className="space-y-1.5 pt-1">
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">Legal Name:</span>
                          <span className="text-white font-medium">
                            {reg.fan.first_name} {reg.fan.last_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">Email & Phone:</span>
                          <span className="text-white">{reg.fan.email}</span>
                          <span className="text-[#9E9EAF] block">{reg.fan.phone_number}</span>
                        </div>
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">Physical Shipping Address:</span>
                          <span className="text-white block">
                            {reg.fan.shipping_address_line1}
                            {reg.fan.shipping_address_line2 ? `, ${reg.fan.shipping_address_line2}` : ""}
                          </span>
                          <span className="text-[#9E9EAF]">
                            {reg.fan.shipping_city}, {reg.fan.shipping_state} {reg.fan.shipping_postal_code}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#9E9EAF]">Fan profile unavailable</span>
                    )}
                  </div>

                  {/* Related Registration */}
                  <div className="p-3.5 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold text-[11px] uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Related Registration & Schedule</span>
                    </div>
                    {reg ? (
                      <div className="space-y-1.5 pt-1">
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">Tour Stop City:</span>
                          <span className="text-white font-medium">
                            {reg.city?.name}, {reg.city?.state}
                          </span>
                          <span className="text-[#9E9EAF] block text-[11px]">
                            {reg.city?.venue_name} ({reg.city?.tour_date})
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">Registration ID & Status:</span>
                          <span className="font-mono text-[#9E9EAF]">{reg.id}</span>
                          <span className="ml-2">
                            <Badge variant="neutral" size="sm">
                              {reg.status}
                            </Badge>
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B6B7E] block text-[10px]">VIP Call Time:</span>
                          <span className="text-white font-mono">
                            {reg.schedule?.arrival_time || reg.schedule?.start_time || "Awaiting Call Time"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#9E9EAF]">Registration details unavailable</span>
                    )}
                  </div>
                </div>

                {/* Status Change Form */}
                <form onSubmit={handleSaveDetailStatus} className="p-3.5 rounded-lg bg-[#14141C] border border-[#2A2A38] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E1E28] pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-semibold">
                      Advance / Change Fulfillment Status
                    </span>
                    <span className="text-[11px] text-[#9E9EAF]">
                      Current: <strong>{detailCard.current_status}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Target Fulfillment State"
                      value={detailTargetStatus}
                      onChange={(e) => setDetailTargetStatus(e.target.value as FanCardStatus)}
                      options={STAGES.map((s) => ({
                        value: s.status,
                        label: `${s.label} ${s.status === detailCard.current_status ? "(Current)" : ""}`,
                      }))}
                    />
                    <Input
                      label="Courier Tracking Number / Reference"
                      placeholder="e.g. USPS 9400 1234 5678 90"
                      value={detailCourierRef}
                      onChange={(e) => setDetailCourierRef(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF] block">
                      Internal Fulfillment Notes / Delivery Notes
                    </label>
                    <textarea
                      rows={2}
                      value={detailInternalNotes}
                      onChange={(e) => setDetailInternalNotes(e.target.value)}
                      placeholder="Enter internal production notes or courier notes (saved non-destructively into timeline)..."
                      className="w-full text-xs bg-[#0E0E12] border border-[#2A2A38] text-white rounded-lg p-2 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="detail_send_email"
                        checked={detailSendEmail}
                        onChange={(e) => setDetailSendEmail(e.target.checked)}
                        className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="detail_send_email" className="text-xs text-[#F8F8FC]">
                        Dispatch automated status email to fan
                      </label>
                    </div>

                    <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                      {isPending ? "Updating Status..." : "Save Status Transition"}
                    </Button>
                  </div>
                </form>

                {/* Status Timeline History Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                    <History className="h-3.5 w-3.5" />
                    <span>Fan Card Status Timeline ({detailCard.history.length})</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {detailCard.history.map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#1E1E28] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-medium">
                            {entry.previous_status ? (
                              <>
                                <span className="text-[#9E9EAF]">{entry.previous_status}</span>
                                <ArrowRight className="h-3 w-3 text-[#6B6B7E]" />
                              </>
                            ) : null}
                            <span className="text-[#D4AF37] font-semibold">{entry.new_status}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#6B6B7E]">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#9E9EAF]">
                          <span>
                            Changed by: <strong>{entry.changed_by_name || entry.changed_by}</strong>
                          </span>
                        </div>

                        {entry.internal_note && (
                          <div className="text-[11px] text-[#E2E8F0] bg-[#16161D] p-1.5 rounded border border-[#2A2A38]">
                            &ldquo;{entry.internal_note}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#1E1E28]">
                  <Button variant="ghost" onClick={() => setDetailCard(null)}>
                    Close Dossier
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 2. Quick Advance Modal                                                */}
      {/* ===================================================================== */}
      {advanceCard && (
        <Modal
          isOpen={!!advanceCard}
          onClose={() => setAdvanceCard(null)}
          title={`Quick Advance Fan Card — ${advanceCard.tracking_code}`}
          description={`Current: ${advanceCard.current_status}`}
        >
          <form onSubmit={handleSaveQuickAdvance} className="space-y-4">
            <Select
              label="New Fulfillment State"
              value={advanceTargetStatus}
              onChange={(e) => setAdvanceTargetStatus(e.target.value as FanCardStatus)}
              options={STAGES.map((s) => ({
                value: s.status,
                label: `${s.label} ${s.status === advanceCard.current_status ? "(Current)" : ""}`,
              }))}
            />

            <Input
              label="Courier Reference Number"
              placeholder="e.g. USPS-PRIORITY-ATL-9921"
              value={advanceCourierRef}
              onChange={(e) => setAdvanceCourierRef(e.target.value)}
            />

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF] block">
                Internal Fulfillment Notes
              </label>
              <textarea
                rows={2}
                value={advanceInternalNotes}
                onChange={(e) => setAdvanceInternalNotes(e.target.value)}
                placeholder="Fulfillment or packing note..."
                className="w-full text-xs bg-[#0E0E12] border border-[#2A2A38] text-white rounded-lg p-2 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="advance_send_email"
                checked={advanceSendEmail}
                onChange={(e) => setAdvanceSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <label htmlFor="advance_send_email" className="text-xs text-[#F8F8FC]">
                Dispatch automated status email to fan
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E28]">
              <Button type="button" variant="ghost" onClick={() => setAdvanceCard(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Advancing..." : "Confirm Advance"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 3. Delivery Exception Modal                                           */}
      {/* ===================================================================== */}
      {issueModalCard && (
        <Modal
          isOpen={!!issueModalCard}
          onClose={() => setIssueModalCard(null)}
          title={`Flag Delivery Issue — ${issueModalCard.tracking_code}`}
          description="Flag courier delays, damaged parcels, or incorrect delivery coordinates."
        >
          <form onSubmit={handleSaveIssue} className="space-y-4">
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#F87171] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Delivery Exception Flag</span>
                This will set the card status to DELIVERY_ISSUE, record an audit event, and notify the fan with instructions on how to resolve the issue.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#EF4444] block font-semibold">
                Reason for Delivery Issue *
              </label>
              <textarea
                rows={3}
                required
                value={issueReason}
                onChange={(e) => setIssueReason(e.target.value)}
                placeholder="Explain the delivery issue (e.g. Courier reported invalid street address, package returned to sender)..."
                className="w-full text-xs bg-[#0E0E12] border border-[#EF4444]/40 text-white rounded-lg p-2.5 focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="issue_send_email"
                checked={issueSendEmail}
                onChange={(e) => setIssueSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#EF4444] focus:ring-[#EF4444]"
              />
              <label htmlFor="issue_send_email" className="text-xs text-[#F8F8FC]">
                Send delivery issue resolution email alert to fan
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E28]">
              <Button type="button" variant="ghost" onClick={() => setIssueModalCard(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isPending || issueReason.trim().length < 3}
                className="border-[#EF4444]/50 text-[#EF4444] hover:bg-[#EF4444]/20"
              >
                {isPending ? "Flagging Issue..." : "Flag Delivery Issue"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 4. Safe Batch Advance Modal                                           */}
      {/* ===================================================================== */}
      {isBatchModalOpen && (
        <Modal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          title={`Bulk Advance ${selectedCardIds.length} Fan Cards`}
          description="Batch operations preserve complete audit trails and validate transitions individually."
        >
          <form onSubmit={handleSaveBatchAdvance} className="space-y-4">
            <div className="p-3 bg-[#111115] border border-[#2A2A38] rounded-lg text-xs space-y-1">
              <span className="text-white font-semibold block">Batch Operation Safety Guardrails:</span>
              <p className="text-[#9E9EAF]">
                Each card will be validated before advancing. Cards with incompatible transition states (e.g. already delivered) will be safely skipped. Individual audit logs will be generated for every card.
              </p>
            </div>

            <Select
              label="Target Bulk Status"
              value={batchTargetStatus}
              onChange={(e) => setBatchTargetStatus(e.target.value as FanCardStatus)}
              options={STAGES.map((s) => ({
                value: s.status,
                label: s.label,
              }))}
            />

            <Input
              label="Optional Courier Batch Reference"
              placeholder="e.g. USPS-BATCH-2026-11-A"
              value={batchCourierRef}
              onChange={(e) => setBatchCourierRef(e.target.value)}
            />

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF] block">
                Internal Batch Fulfillment Note
              </label>
              <textarea
                rows={2}
                value={batchInternalNotes}
                onChange={(e) => setBatchInternalNotes(e.target.value)}
                placeholder="Bulk shipment or packaging notes..."
                className="w-full text-xs bg-[#0E0E12] border border-[#2A2A38] text-white rounded-lg p-2 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="batch_send_email"
                checked={batchSendEmail}
                onChange={(e) => setBatchSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <label htmlFor="batch_send_email" className="text-xs text-[#F8F8FC]">
                Dispatch automated status emails to all recipient fans in batch
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E28]">
              <Button type="button" variant="ghost" onClick={() => setIsBatchModalOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Processing Batch..." : `Confirm Bulk Advance (${selectedCardIds.length})`}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}

export default function AdminFanCardsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell
          title="Physical Fan Card Fulfillment"
          subtitle="Loading fulfillment console..."
        >
          <div className="py-20 text-center text-xs text-[#9E9EAF]">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-[#D4AF37]" />
            Loading Fan Cards...
          </div>
        </AdminShell>
      }
    >
      <FanCardsContent />
    </Suspense>
  );
}
