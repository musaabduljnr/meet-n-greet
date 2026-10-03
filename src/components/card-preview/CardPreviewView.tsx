"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Crown,
  Search,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Lock,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { GoldMembershipCard } from "./GoldMembershipCard";
import { trackFanCardAction } from "@/app/actions/track";
import { SafeTrackingData } from "@/lib/services/tracking-service";
import { isValidTrackingCodeFormat } from "@/lib/security/tracking-code";

export const CardPreviewView: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [trackingData, setTrackingData] = useState<SafeTrackingData | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const performLookup = (queryCode: string) => {
    const cleaned = queryCode.trim().toUpperCase();
    if (!cleaned || !isValidTrackingCodeFormat(cleaned)) {
      setErrorCode("INVALID_FORMAT");
      setErrorMessage("Please enter a valid tracking code (e.g. KWFC-XXXX-XXXX).");
      return;
    }

    setErrorCode(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await trackFanCardAction(cleaned);
        if (!result.success) {
          setTrackingData(null);
          setErrorCode(result.code || "NOT_FOUND");
          setErrorMessage(result.message);
          return;
        }

        setTrackingData(result.data || null);
      } catch {
        setTrackingData(null);
        setErrorCode("SERVER_ERROR");
        setErrorMessage("Unable to fetch card information right now. Please try again.");
      }
    });
  };

  useEffect(() => {
    if (initialCode && isValidTrackingCodeFormat(initialCode.trim().toUpperCase())) {
      performLookup(initialCode);
    }
  }, [initialCode]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(code);
    router.replace(`/track/preview?code=${encodeURIComponent(code.trim().toUpperCase())}`);
  };

  const isPrepared = trackingData?.currentStatus === "PREPARED";

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <Container size="md">
          {/* Top Breadcrumb Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href={trackingData ? `/track?code=${encodeURIComponent(trackingData.trackingCode)}` : "/track"}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#9E9EAF] hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Delivery Tracking</span>
            </Link>

            {trackingData && (
              <span className="text-xs font-mono text-[#6B6B7E]">
                Tracking Code: <strong className="text-[#D4AF37]">{trackingData.trackingCode}</strong>
              </span>
            )}
          </div>

          {/* Search Box when no tracking code loaded */}
          {!trackingData && !isPending && (
            <div className="max-w-lg mx-auto mb-10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#181820] border border-[#D4AF37]/40 text-[#D4AF37] mb-3">
                  <Crown className="h-6 w-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase">
                  VIP Gold Card Preview
                </h1>
                <p className="text-xs text-[#9E9EAF] mt-2 max-w-sm mx-auto">
                  Enter your tracking code to view your manufactured commemorative gold membership card.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <Input
                      label="Fan Card Tracking Code"
                      placeholder="KWFC-XXXX-XXXX"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      leftIcon={<Search className="h-4 w-4" />}
                      required
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full h-11"
                      isLoading={isPending}
                    >
                      Lookup Card Preview
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {errorMessage && (
                <div className="mt-6">
                  <Alert variant="error" title="Lookup Failed">
                    {errorMessage}
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* Loading Skeleton */}
          {isPending && (
            <div className="max-w-lg mx-auto text-center py-16 space-y-4 animate-pulse">
              <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-[#9E9EAF]">
                Validating card manufacturing status...
              </p>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCENARIO A: STATUS IS "PREPARED" -> FULL GOLD CARD PREVIEW     */}
          {/* ============================================================= */}
          {!isPending && trackingData && isPrepared && (
            <div className="space-y-10 animate-fadeIn">
              {/* Header Title */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181820] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold tracking-wider uppercase mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Card Prepared & Ready</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8F8FC] uppercase">
                  Commemorative Gold VIP Card
                </h1>
                <p className="text-sm text-[#9E9EAF] max-w-lg mx-auto leading-relaxed">
                  Your personalized metal VIP Fan Card has been engraved, manufactured, and is packaged for courier dispatch.
                </p>
              </div>

              {/* 3D Gold Membership Card Interactive Display */}
              <GoldMembershipCard data={trackingData} showActions={true} />

              {/* Verified Badge Specifications & Fulfillment Note */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-5 rounded-xl bg-[#111115] border border-[#2A2A38]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] mb-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>BADGE SPECIFICATION</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F8F8FC]">
                    Solid Anodized Brass Finish
                  </div>
                  <div className="text-xs text-[#9E9EAF] mt-1 leading-relaxed">
                    Custom metal laser engraving with anti-counterfeit micro-seal.
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#111115] border border-[#2A2A38]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>TOUR ACCESS PRIVILEGE</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F8F8FC]">
                    {trackingData.cityName ? `${trackingData.cityName}, ${trackingData.cityState}` : "Exclusive VIP Stop"}
                  </div>
                  <div className="text-xs text-[#9E9EAF] mt-1 leading-relaxed">
                    Grants priority entry to the VIP reception and photo op.
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#111115] border border-[#2A2A38]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] mb-2">
                    <Clock className="h-4 w-4" />
                    <span>NEXT STAGE</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F8F8FC]">
                    Dispatch & Courier Transit
                  </div>
                  <div className="text-xs text-[#9E9EAF] mt-1 leading-relaxed">
                    Dispatches shortly via regional carrier to your delivery destination.
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-6 rounded-2xl bg-[#111115] border border-[#2A2A38] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[#F8F8FC]">
                    Want to monitor physical delivery?
                  </div>
                  <div className="text-xs text-[#9E9EAF] mt-0.5">
                    Follow milestone updates from package pickup to your doorstep.
                  </div>
                </div>

                <Link href={`/track?code=${encodeURIComponent(trackingData.trackingCode)}`}>
                  <Button variant="secondary" size="md" rightIcon={<ExternalLink className="h-4 w-4" />}>
                    View Delivery Timeline
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCENARIO B: STATUS IS NOT "PREPARED" -> GATED ACCESS NOTICE   */}
          {/* ============================================================= */}
          {!isPending && trackingData && !isPrepared && (
            <div className="max-w-lg mx-auto text-center space-y-6 py-6 animate-fadeIn">
              <div className="h-16 w-16 rounded-full bg-[#181820] border-2 border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center mx-auto shadow-2xl">
                <Lock className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                  Card Preview Gate
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC]">
                  Card Preview Currently Locked
                </h1>
                <p className="text-xs sm:text-sm text-[#9E9EAF] max-w-md mx-auto leading-relaxed">
                  The digital Gold Membership Card preview pulls up exclusively when your commemorative badge has reached the{" "}
                  <strong className="text-[#D4AF37] uppercase">Prepared</strong> stage.
                </p>
              </div>

              {/* Status Comparison Box */}
              <div className="p-6 rounded-2xl bg-[#111115] border border-[#2A2A38] text-left space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
                  <span className="text-xs text-[#9E9EAF]">Your Current Stage:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#181820] border border-[#3E3E52] text-xs font-mono font-bold text-[#F8F8FC]">
                    {trackingData.statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
                  <span className="text-xs text-[#9E9EAF]">Required Stage:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-xs font-mono font-bold text-[#D4AF37]">
                    PREPARED
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#9E9EAF] pt-1">
                  <AlertCircle className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    Your physical metal badge identity is currently queued or in transit. Once tour operations completes manufacturing and packaging, this preview will automatically unlock.
                  </span>
                </div>
              </div>

              {/* Navigation CTA */}
              <div className="pt-2">
                <Link href={`/track?code=${encodeURIComponent(trackingData.trackingCode)}`}>
                  <Button variant="primary" size="md" className="w-full sm:w-auto px-8">
                    View Live Fulfillment Progress
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
