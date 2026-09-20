"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Timeline } from "@/components/ui/Timeline";
import { trackFanCardAction } from "@/app/actions/track";
import { SafeTrackingData } from "@/lib/services/tracking-service";
import { isValidTrackingCodeFormat } from "@/lib/security/tracking-code";

export const TrackingPortal: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);
  const [inputError, setInputError] = useState<string | null>(null);

  // Status & Data
  const [trackingData, setTrackingData] = useState<SafeTrackingData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Execute tracking query
  const performLookup = (queryCode: string) => {
    const cleaned = queryCode.trim().toUpperCase();

    if (!cleaned) {
      setInputError("Please enter your private tracking code.");
      return;
    }

    if (!isValidTrackingCodeFormat(cleaned)) {
      setInputError(
        "Invalid code format. Codes follow KWFC-XXXX-XXXX or KW-XXXX-XXXX."
      );
      return;
    }

    setInputError(null);
    setErrorCode(null);
    setStatusMessage(null);
    setActiveCode(cleaned);

    startTransition(async () => {
      try {
        const result = await trackFanCardAction(cleaned);

        if (!result.success) {
          setTrackingData(null);
          setErrorCode(result.code || "NOT_FOUND");
          setStatusMessage(result.message);
          return;
        }

        setTrackingData(result.data || null);
      } catch {
        setTrackingData(null);
        setErrorCode("SERVER_ERROR");
        setStatusMessage("A network or server error occurred. Please try again shortly.");
      }
    });
  };

  // Perform initial lookup if URL contains valid code
  useEffect(() => {
    if (initialCode && isValidTrackingCodeFormat(initialCode.trim().toUpperCase())) {
      performLookup(initialCode);
    }
  }, [initialCode]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(code);
    router.replace(`/track?code=${encodeURIComponent(code.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1 py-12 md:py-20">
        <Container size="md">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
              Guest Fulfillment Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
              Track Your Fan Card
            </h1>
            <p className="text-sm text-[#9E9EAF] mt-2 max-w-lg mx-auto leading-relaxed">
              Enter the private tracking code sent to your email to check your latest physical Fan Card delivery status.
            </p>
          </div>

          {/* Search Box */}
          <Card className="mb-10 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    label="Fan Card Tracking Code"
                    placeholder="KWFC-XXXX-XXXX"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    error={inputError || undefined}
                    leftIcon={<Search className="h-4 w-4" />}
                    required
                  />
                </div>
                <div className="sm:pt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto h-11 px-6 shrink-0"
                    isLoading={isPending}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    Track Fan Card
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs text-[#6B6B7E] pt-4 border-t border-[#1E1E28]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  <span>Private access &bull; Zero public PII</span>
                </span>
                <Link href="/#support" className="hover:text-[#F8F8FC] transition-colors underline">
                  Can&apos;t find your code?
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* ================================================================= */}
          {/* STATE 1: LOADING SKELETON                                         */}
          {/* ================================================================= */}
          {isPending && (
            <div className="space-y-6 animate-pulse">
              <Card className="p-6 space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </Card>
              <Card className="p-6 space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 2: NOT FOUND STATE                                          */}
          {/* ================================================================= */}
          {!isPending && errorCode === "NOT_FOUND" && (
            <div className="space-y-6">
              <EmptyState
                icon={<Search className="h-6 w-6 text-[#D4AF37]" />}
                title="Fan Card Record Not Located"
                description={
                  statusMessage ||
                  "No Fan Card record was found matching this code. Please check your registration confirmation email to confirm the exact code."
                }
                action={
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCode("")}
                    >
                      Clear & Try Another Code
                    </Button>
                    <Link href="/">
                      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                }
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 3: RATE LIMITED OR SERVER ERROR STATE                       */}
          {/* ================================================================= */}
          {!isPending && errorCode && errorCode !== "NOT_FOUND" && (
            <div className="space-y-6">
              <Alert
                variant={errorCode === "RATE_LIMITED" ? "warning" : "error"}
                title={errorCode === "RATE_LIMITED" ? "Rate Limit Reached" : "Lookup Error"}
              >
                {statusMessage}
              </Alert>

              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performLookup(code)}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Retry Lookup
                </Button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 4: SUCCESSFUL TRACKING STATE                                */}
          {/* ================================================================= */}
          {!isPending && trackingData && (
            <div className="space-y-8 animate-fadeIn">
              {/* Delivery Issue Alert if flagged by admin */}
              {trackingData.hasIssue && (
                <Alert
                  variant="warning"
                  title="Fulfillment Notice: Delivery Exception"
                >
                  {trackingData.issueMessage}
                </Alert>
              )}

              {/* Status Header Badge Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#111115] border border-[#2A2A38] shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E1E28]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-semibold">
                      VIP Fan Card Status
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <h2 className="text-2xl font-bold tracking-tight text-[#F8F8FC]">
                        {trackingData.fanInitial} (VIP Guest)
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#181820] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                        {trackingData.trackingCode}
                      </span>
                    </div>

                    <p className="text-xs text-[#9E9EAF] mt-1.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>{trackingData.cityName}, {trackingData.cityState}</span>
                      <span className="text-[#3E3E52]">&bull;</span>
                      <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>{new Date(`${trackingData.tourDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    <span className="text-[11px] font-mono text-[#9E9EAF]">Current Stage</span>
                    <StatusIndicator type="fan_card" status={trackingData.currentStatus} />
                  </div>
                </div>

                {/* Sub-bar: Last updated & Admin Control Note */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6B6B7E]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>
                      Status last updated:{" "}
                      <strong className="text-[#9E9EAF]">
                        {new Date(trackingData.lastUpdated).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>

                  <span className="italic">
                    Fulfillment stages are manually verified by tour operations.
                  </span>
                </div>
              </div>

              {/* Milestone Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Fulfillment Timeline</CardTitle>
                  <CardDescription>
                    Follow the verified progress of your commemorative metal VIP Fan Card from production through physical delivery.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Timeline Stepper (Responsive vertical/horizontal) */}
                  <Timeline
                    steps={trackingData.timeline}
                    orientation="horizontal"
                    className="hidden lg:block py-4"
                  />
                  <Timeline
                    steps={trackingData.timeline}
                    orientation="vertical"
                    className="block lg:hidden py-2"
                  />
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link href="/">
                    <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                      Back to Home
                    </Button>
                  </Link>

                  <Link href="/#support">
                    <Button variant="ghost" size="md" leftIcon={<HelpCircle className="h-4 w-4" />}>
                      Contact Fulfillment Support
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* ================================================================= */}
          {/* STATE 5: INITIAL / EMPTY STATE BEFORE SEARCH                      */}
          {/* ================================================================= */}
          {!isPending && !trackingData && !errorCode && (
            <div className="p-8 rounded-xl border border-dashed border-[#2A2A38] bg-[#111115]/40 text-center">
              <div className="h-12 w-12 rounded-full bg-[#181820] border border-[#2A2A38] text-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-[#F8F8FC]">
                Live Fan Card Tracker
              </h3>
              <p className="text-xs text-[#9E9EAF] max-w-md mx-auto mt-1 leading-relaxed">
                Enter your 8-character tracking code above to check whether your commemorative metal badge is being processed, packaged, or in transit with our direct tour couriers.
              </p>
              <div className="mt-6">
                <Link href="/">
                  <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </main>

      <PublicFooter />
    </div>
  );
};
