"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  QrCode,
  RotateCcw,
  Check,
  Copy,
  Printer,
  Award,
  Crown,
  Wifi,
} from "lucide-react";
import { SafeTrackingData } from "@/lib/services/tracking-service";

interface GoldMembershipCardProps {
  data: SafeTrackingData;
  showActions?: boolean;
}

export const GoldMembershipCard: React.FC<GoldMembershipCardProps> = ({
  data,
  showActions = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const formattedTourDate =
    data.tourDate && !isNaN(new Date(data.tourDate).getTime())
      ? new Date(
          data.tourDate.includes("T") ? data.tourDate : `${data.tourDate}T12:00:00`
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Tour Season 2026";

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* 3D Card Container */}
      <div
        className="w-full cursor-pointer select-none group"
        style={{ perspective: "1200px" }}
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label="Click to flip VIP Gold Membership Card"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div
          className="relative w-full aspect-[1.586/1] transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ============================================================= */}
          {/* CARD FRONT                                                    */}
          {/* ============================================================= */}
          <div
            className="absolute inset-0 rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.3)] border-2 border-[#FFE885] overflow-hidden flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background:
                "linear-gradient(135deg, #ECC86A 0%, #E0B543 18%, #FFF4D0 32%, #C29324 55%, #F0CE74 78%, #9E7412 100%)",
            }}
          >
            {/* Subtle Metallic Brushed Texture Overlay */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)",
              }}
            />

            {/* Specular Diagonal Light Bar */}
            <div
              className="absolute -inset-full opacity-30 pointer-events-none transform rotate-12 transition-transform duration-1000 group-hover:translate-x-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              }}
            />

            {/* Inset Border Filigree */}
            <div className="absolute inset-2 sm:inset-3 rounded-xl border border-[#FFF8DC]/40 pointer-events-none" />

            {/* Top Row: Brand & Pass Type */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#1A1505] border border-[#FFE885] flex items-center justify-center shadow-md">
                  <Crown className="h-5 w-5 text-[#FFE885]" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#2C2106] font-bold">
                    Official VIP Fan Pass
                  </div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-[#161002] leading-none uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                    Kountry Wayne
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181203]/90 text-[#FFE885] border border-[#FFE885]/60 shadow-inner">
                <Sparkles className="h-3 w-3 text-[#FFE885] animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                  Gold VIP
                </span>
              </div>
            </div>

            {/* Middle Row: Smart Chip & Contactless Sensor */}
            <div className="relative z-10 flex items-center gap-4 my-auto pt-1">
              {/* EMV Microchip Graphic */}
              <div className="relative w-12 h-9 rounded-md bg-gradient-to-br from-[#E6BC50] via-[#F8DE8D] to-[#997316] border border-[#7A5B0B] shadow-md overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px] p-[2px] opacity-70">
                  <div className="border-r border-b border-[#5C4204]" />
                  <div className="border-b border-[#5C4204]" />
                  <div className="border-l border-b border-[#5C4204]" />
                  <div className="border-r border-[#5C4204]" />
                  <div className="border border-[#5C4204] rounded-sm bg-[#ECC86A]" />
                  <div className="border-l border-[#5C4204]" />
                </div>
              </div>

              {/* Contactless RFID waves */}
              <Wifi className="h-5 w-5 text-[#2C2106] transform rotate-90 opacity-70" />

              {/* Holographic Seal Simulation */}
              <div className="ml-auto h-8 w-8 rounded-full border border-[#FFF]/80 bg-gradient-to-tr from-pink-400/40 via-teal-300/40 to-yellow-200/50 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-4 w-4 text-[#161002]" />
              </div>
            </div>

            {/* Bottom Row: Embossed Cardholder Name & Tracking Code */}
            <div className="relative z-10 pt-2 border-t border-[#3A2C08]/20 flex items-end justify-between">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#3B2D0A] font-semibold">
                  VIP Guest Identity
                </div>
                <div className="text-base sm:text-xl font-bold tracking-tight text-[#161002] uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] truncate max-w-[240px] sm:max-w-[280px]">
                  {data.fullName || `${data.fanInitial} (VIP Guest)`}
                </div>
                <div className="text-[10px] font-mono text-[#2E2205] font-semibold mt-0.5">
                  {data.cityName ? `${data.cityName}, ${data.cityState}` : "Tour Access"}{" "}
                  &bull; {formattedTourDate}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#3B2D0A] font-semibold">
                  Member Code
                </div>
                <div className="font-mono text-xs sm:text-sm font-black text-[#161002] tracking-wider bg-[#FFF8DC]/40 px-2 py-0.5 rounded border border-[#3A2C08]/20">
                  {data.trackingCode}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* CARD BACK                                                     */}
          {/* ============================================================= */}
          <div
            className="absolute inset-0 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.3)] border-2 border-[#FFE885] overflow-hidden flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background:
                "linear-gradient(135deg, #ECC86A 0%, #D8A932 25%, #FFF0C0 45%, #B88519 65%, #ECC86A 100%)",
            }}
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-11 bg-[#1A1713] mt-5 shadow-inner relative flex items-center justify-end pr-4">
              <span className="text-[9px] font-mono text-[#665B47] tracking-widest uppercase">
                VIP AUTHENTICATED
              </span>
            </div>

            {/* Signature & Security Section */}
            <div className="px-6 py-2">
              <div className="flex items-center gap-3">
                {/* Signature Panel */}
                <div className="flex-1 bg-[#FDFBF7] h-9 rounded px-3 flex items-center justify-between border border-[#A67E1E]">
                  <span className="font-serif italic text-sm text-[#1A1713] font-bold select-none tracking-wide">
                    {data.fullName || "Authorized VIP Guest"}
                  </span>
                  <span className="text-[10px] font-mono text-[#8C6B1B] font-bold">
                    SECURITY CODE: KW-VIP
                  </span>
                </div>

                {/* Hologram Stamp */}
                <div className="h-9 w-9 rounded-full bg-[#181203] border border-[#FFE885] flex items-center justify-center">
                  <Award className="h-5 w-5 text-[#FFE885]" />
                </div>
              </div>

              {/* Disclaimer & Terms */}
              <p className="text-[9px] text-[#2E2205] leading-tight mt-2.5 opacity-90">
                This official commemorative Gold VIP pass verifies private access for{" "}
                <strong className="text-[#161002]">{data.fullName}</strong>. Present upon venue arrival
                along with photo ID. Non-transferable. Valid exclusively for the designated tour stop.
              </p>
            </div>

            {/* Bottom Bar: Barcode representation & Tour Stamp */}
            <div className="px-6 pb-5 flex items-center justify-between border-t border-[#3A2C08]/20 pt-2">
              <div className="flex items-center gap-2">
                <QrCode className="h-7 w-7 text-[#161002]" />
                <div className="text-[9px] font-mono text-[#2E2205] leading-tight">
                  <div>DISPATCH STATUS: PREPARED</div>
                  <div className="font-bold text-[#161002]">ID: {data.trackingCode}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#181203] text-[#FFE885] border border-[#FFE885]/40">
                  VERIFIED PASS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Interactive Hint */}
      {showActions && (
        <div className="w-full mt-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-[#9E9EAF]">
            <RotateCcw className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Click or tap the card to flip between front and back</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-xs font-semibold text-[#F8F8FC] transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-[#D4AF37]" />
              <span>Flip Card</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-xs font-semibold text-[#F8F8FC] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#D4AF37]" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5BE48] text-[#09090B] text-xs font-bold transition-colors shadow-lg"
            >
              <Printer className="h-4 w-4" />
              <span>Print Pass</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
