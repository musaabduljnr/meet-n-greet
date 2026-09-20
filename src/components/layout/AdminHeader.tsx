"use client";

import React, { useTransition } from "react";
import { Menu, User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { logoutAdminAction } from "@/app/actions/auth";
import type { AdminRole } from "@/lib/security/rbac";

export interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  adminEmail?: string;
  adminRole?: AdminRole;
  onSignOut?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onToggleSidebar,
  adminEmail = "superadmin@kountrywayne.com",
  adminRole = "SUPER_ADMIN",
  onSignOut,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  const getBadgeVariant = (role: AdminRole): "default" | "info" | "secondary" => {
    switch (role) {
      case "SUPER_ADMIN":
        return "default";
      case "ADMIN":
        return "info";
      case "STAFF":
      default:
        return "secondary";
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-[#2A2A38] bg-[#0E0E12]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            className="lg:hidden p-2 text-[#9E9EAF] hover:text-white rounded-md hover:bg-[#181820] transition-colors"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <div>
          <h1 className="text-base font-semibold text-[#F8F8FC] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#9E9EAF] hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Badge variant={getBadgeVariant(adminRole)} size="sm" dot>
          {adminRole.replace("_", " ")}
        </Badge>

        <div className="h-4 w-px bg-[#2A2A38] hidden sm:block" aria-hidden="true" />

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#1F1F28] border border-[#2A2A38] flex items-center justify-center text-[#D4AF37]">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-xs text-[#F8F8FC] font-medium hidden md:inline-block max-w-[170px] truncate">
            {adminEmail}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          title="Sign out of admin console"
          aria-label="Sign out of admin console"
          className="p-2 text-[#9E9EAF] hover:text-[#EF4444] rounded-md hover:bg-[#181820] transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
