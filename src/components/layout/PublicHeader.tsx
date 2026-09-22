"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Search, MapPin } from "lucide-react";
import { Container } from "./Container";
import { MobileNav } from "./MobileNav";
import { Button } from "@/components/ui/Button";

export const PublicHeader: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#2A2A38]/80 bg-[#09090B]/90 backdrop-blur-md">
        <Container size="xl">
          <div className="flex h-20 items-center justify-between">
            {/* Brand Logotype */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md py-1"
            >
              <div className="h-10 w-10 rounded-full border border-[#D4AF37]/40 bg-[#181820] flex items-center justify-center text-[#D4AF37] font-bold text-sm tracking-wider shadow-inner group-hover:border-[#D4AF37] transition-colors">
                KW
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#D4AF37] font-medium leading-none">
                  VIP Guest Portal
                </span>
                <span className="text-base font-bold tracking-tight text-[#F8F8FC] uppercase group-hover:text-white transition-colors">
                  Kountry Wayne
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-7 text-sm font-medium"
              aria-label="Main Navigation"
            >
              <Link
                href="/register"
                className="text-[#D4AF37] hover:text-[#F3E5AB] font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>VIP Membership</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 uppercase">
                  Register
                </span>
              </Link>
              <Link
                href="/#available-cities"
                className="text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
              >
                Available Cities
              </Link>
              <Link
                href="/#how-it-works"
                className="text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/#tracking-section"
                className="text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
              >
                Track Fan Card
              </Link>
              <Link
                href="/#faq"
                className="text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
              >
                FAQ
              </Link>
            </nav>

            {/* Desktop & Mobile Actions */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2.5">
                <Link href="/#tracking-section">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Search className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Track Code
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Register
                  </Button>
                </Link>
              </div>

              {/* Collapsible Sidebar Toggle Button (Desktop & Mobile) */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Toggle collapsible navigation sidebar"
                aria-expanded={mobileNavOpen}
                id="header-sidebar-toggle-btn"
                className="p-2 text-[#9E9EAF] hover:text-white rounded-lg hover:bg-[#181820] border border-[#2A2A38] transition-colors flex items-center gap-1.5"
              >
                <Menu className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-xs font-medium hidden md:inline text-[#F8F8FC]">Menu</span>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
};
