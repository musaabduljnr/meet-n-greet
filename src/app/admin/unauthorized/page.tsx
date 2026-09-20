"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logoutAdminAction } from "@/app/actions/auth";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("from") || "this section";
  const userRole = searchParams.get("role") || "STAFF";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#09090B] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-[#261616] border border-[#E05252] text-[#E05252] flex items-center justify-center mx-auto mb-6 shadow-xl">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-[#E05252] font-semibold">
          Error 403 &bull; Access Forbidden
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-2">
          Insufficient Privileges
        </h1>

        <p className="text-sm text-[#9E9EAF] mt-3 leading-relaxed">
          Your account is authenticated as <strong className="text-[#F8F8FC]">{userRole}</strong>, but your assigned role does not possess permissions to access <code className="px-1.5 py-0.5 rounded bg-[#181820] text-[#D4AF37] font-mono text-xs">{requestedPath}</code>.
        </p>

        <Card className="mt-8 border-[#2A2A38] bg-[#111115]">
          <CardContent className="p-6 space-y-3">
            <Link href="/admin" className="w-full block">
              <Button variant="primary" size="md" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Return to Admin Dashboard
              </Button>
            </Link>

            <form action={logoutAdminAction} className="w-full block">
              <Button
                type="submit"
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign In with Higher Privileges
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-[#6B6B7E] mt-6">
          If you require elevated permissions, contact a Tour Super Administrator.
        </p>
      </div>
    </div>
  );
}

export default function AdminUnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-[#9E9EAF]">
          Checking authorization...
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
