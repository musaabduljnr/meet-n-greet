import React from "react";
import Link from "next/link";
import { Container } from "./Container";
import { ShieldCheck, Lock } from "lucide-react";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#2A2A38] bg-[#09090B] text-[#9E9EAF] text-sm py-14">
      <Container size="xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1E1E28]">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border border-[#D4AF37]/50 bg-[#181820] flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                KW
              </div>
              <span className="text-base font-bold text-[#F8F8FC] uppercase tracking-tight">
                Kountry Wayne Meet & Greet
              </span>
            </div>
            <p className="text-xs text-[#9E9EAF] leading-relaxed max-w-md">
              Dedicated guest portal for Kountry Wayne Meet & Greet opportunities and commemorative Fan Card tracking. Cohort schedules, arrival times, and venue entrance guidelines are communicated directly by email.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium pt-1">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Encrypted Guest Verification & Fulfillment System</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8F8FC]">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/#available-cities" className="hover:text-[#F8F8FC] transition-colors">
                  Available Cities
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#F8F8FC] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#tracking-section" className="hover:text-[#F8F8FC] transition-colors">
                  Track Fan Card
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#F8F8FC] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/#support" className="hover:text-[#F8F8FC] transition-colors">
                  Guest Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Administration */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8F8FC]">
              Operations
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-[#6B6B7E] hover:text-[#D4AF37] transition-colors"
                >
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span>Tour Operations Console</span>
                </Link>
              </li>
              <li>
                <span className="text-[#6B6B7E]">
                  Cryptographic Fan Card Codes
                </span>
              </li>
              <li>
                <span className="text-[#6B6B7E]">
                  Zero-Public PII Architecture
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B7E]">
          <p>
            &copy; {new Date().getFullYear()} Kountry Wayne Meet & Greet Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>VIP Operations & Fulfillment</span>
            <span>&bull;</span>
            <span>Direct Tour Dispatch</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
