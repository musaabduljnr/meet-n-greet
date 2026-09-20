"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import type { AdminRole } from "@/lib/security/rbac";
import { getCurrentAdminSessionAction } from "@/app/actions/auth";

export interface AdminShellProps {
  title: string;
  subtitle?: string;
  adminEmail?: string;
  adminRole?: AdminRole;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  title,
  subtitle,
  adminEmail: initialEmail,
  adminRole: initialRole,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(initialEmail || "superadmin@kountrywayne.com");
  const [currentRole, setCurrentRole] = useState<AdminRole>(initialRole || "SUPER_ADMIN");

  useEffect(() => {
    if (!initialEmail || !initialRole) {
      getCurrentAdminSessionAction().then(({ session }) => {
        if (session) {
          setCurrentEmail(session.email);
          setCurrentRole(session.role);
        }
      });
    }
  }, [initialEmail, initialRole]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F8F8FC]">
      {/* Sidebar navigation with role filtering */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminRole={currentRole}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          adminEmail={currentEmail}
          adminRole={currentRole}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
