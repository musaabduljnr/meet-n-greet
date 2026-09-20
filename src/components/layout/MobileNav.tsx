"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Search, Calendar, ShieldCheck, HelpCircle, MapPin, CreditCard } from "lucide-react";
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
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#111115] border-l border-[#2A2A38] p-6 shadow-2xl flex flex-col justify-between z-10">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#1E1E28]">
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
              aria-label="Close menu"
              className="p-2 text-[#9E9EAF] hover:text-white rounded-md hover:bg-[#181820] transition-colors"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="mt-8 flex flex-col gap-2" aria-label="Mobile Navigation Links">
            <Link
              href="/#available-cities"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <MapPin className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Available Cities</span>
            </Link>

            <Link
              href="/#how-it-works"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <Calendar className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>How It Works</span>
            </Link>

            <Link
              href="/#tracking-section"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <CreditCard className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Track Fan Card</span>
            </Link>

            <Link
              href="/#faq"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Frequently Asked Questions</span>
            </Link>

            <Link
              href="/#support"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#F8F8FC] hover:bg-[#181820] hover:text-[#D4AF37] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Guest Support</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-[#1E1E28] flex flex-col gap-3">
          <Link href="/#available-cities" onClick={onClose} className="w-full">
            <Button variant="primary" size="md" className="w-full">
              Choose Your City
            </Button>
          </Link>
          <Link href="/#tracking-section" onClick={onClose} className="w-full">
            <Button variant="outline" size="md" className="w-full" leftIcon={<Search className="h-4 w-4" />}>
              Track Fan Card
            </Button>
          </Link>
          <p className="text-[11px] text-center text-[#6B6B7E] mt-2">
            Secure Guest Portal &bull; Kountry Wayne Meet & Greet
          </p>
        </div>
      </div>
    </div>
  );
};
