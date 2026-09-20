"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarClock,
  CreditCard,
  History,
  ArrowUpRight,
  X,
} from "lucide-react";
import { canAccessPath, type AdminRole } from "@/lib/security/rbac";

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminRole?: AdminRole;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Tour Cities",
    href: "/admin/cities",
    icon: MapPin,
  },
  {
    name: "Fan Registrations",
    href: "/admin/registrations",
    icon: Users,
  },
  {
    name: "M&G Schedules",
    href: "/admin/schedules",
    icon: CalendarClock,
  },
  {
    name: "Fan Card Fulfillment",
    href: "/admin/fan-cards",
    icon: CreditCard,
  },
  {
    name: "Audit Trail",
    href: "/admin/audit-logs",
    icon: History,
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  adminRole = "SUPER_ADMIN",
}) => {
  const pathname = usePathname();

  // Filter navigation items by role permissions
  const visibleNavItems = navItems.filter((item) =>
    canAccessPath(adminRole, item.href)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111115] border-r border-[#2A2A38]
          flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Admin Sidebar"
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 px-6 border-b border-[#1E1E28] flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded"
            >
              <div className="h-7 w-7 rounded border border-[#D4AF37]/50 bg-[#1A1A22] flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                KW
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F8F8FC]">
                  VIP Console
                </span>
                <span className="text-[10px] text-[#6B6B7E]">
                  Tour Operations
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="lg:hidden p-1 text-[#9E9EAF] hover:text-white rounded hover:bg-[#181820]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5" aria-label="Admin Console Navigation">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-[#D4AF37]/10 text-[#F3E5AB] border border-[#D4AF37]/30"
                        : "text-[#9E9EAF] hover:text-[#F8F8FC] hover:bg-[#181820]"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-[#D4AF37]" : "text-[#6B6B7E]"}`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Link to Public Site */}
        <div className="p-4 border-t border-[#1E1E28]">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-lg bg-[#0E0E12] border border-[#2A2A38] text-xs text-[#9E9EAF] hover:text-white hover:border-[#3E3E52] transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-medium text-[#F8F8FC]">Public Fan Portal</span>
              <span className="text-[10px] text-[#6B6B7E]">View live site</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </>
  );
};
