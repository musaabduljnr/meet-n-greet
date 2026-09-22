"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  X,
  Search,
  Calendar,
  ShieldCheck,
  HelpCircle,
  MapPin,
  CreditCard,
  Crown,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Collapsible Navigation Sidebar"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#111115] border-l border-[#2A2A38] p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#1E1E28]">
            <div className="flex flex-col">
              <span className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
                VIP Guest Portal
              </span>
              <span className="text-sm font-bold tracking-tight text-[#F8F8FC]">
                KOUNTRY WAYNE
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close sidebar"
              className="p-2 text-[#9E9EAF] hover:text-white rounded-md hover:bg-[#181820] transition-colors"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Prominent VIP Membership Registration Card */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 via-[#181820] to-[#111115] border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/25 border border-[#D4AF37]/50 text-[10px] font-bold font-mono text-[#F3E5AB] uppercase tracking-wider">
                <Crown className="h-3 w-3 text-[#D4AF37]" />
                VIP Member Pass
              </span>
              <span className="text-[10px] text-[#D4AF37] font-mono font-semibold">2026 Tour</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              VIP Membership Registration
            </h3>
            <p className="text-xs text-[#9E9EAF] mt-1.5 leading-relaxed">
              Official registration for Meet & Greet cohorts and commemorative physical Fan Card issuance. Valid photo ID required.
            </p>
            <div className="mt-3.5">
              <Link href="/register" onClick={onClose} className="block w-full">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center shadow-lg font-semibold"
                  leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                  id="sidebar-register-membership-btn"
                >
                  Membership Registration
                </Button>
              </Link>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 flex flex-col gap-1.5" aria-label="Sidebar Navigation Links">
            <Link
              href="/register"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-[#F8F8FC] bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-[#F3E5AB]">Membership Registration</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-[#D4AF37] text-black">
                VIP
              </span>
            </Link>

            <Link
              href="/#available-cities"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <MapPin className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Available Cities</span>
            </Link>

            <Link
              href="/#how-it-works"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <Calendar className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>How It Works</span>
            </Link>

            <Link
              href="/#tracking-section"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <CreditCard className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Track Fan Card</span>
            </Link>

            <Link
              href="/#faq"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Frequently Asked Questions</span>
            </Link>

            <Link
              href="/#support"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Guest Support</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-[#1E1E28] flex flex-col gap-2.5 mt-6">
          <Link href="/register" onClick={onClose} className="w-full">
            <Button
              variant="primary"
              size="md"
              className="w-full shadow-lg"
              leftIcon={<Crown className="h-4 w-4" />}
            >
              Register for Membership
            </Button>
          </Link>
          <Link href="/#tracking-section" onClick={onClose} className="w-full">
            <Button variant="outline" size="md" className="w-full" leftIcon={<Search className="h-4 w-4" />}>
              Track Fan Card
            </Button>
          </Link>
          <p className="text-[11px] text-center text-[#6B6B7E] mt-1">
            Secure VIP Portal &bull; Kountry Wayne Tour Operations
          </p>
        </div>
      </div>
    </div>
  );
};
