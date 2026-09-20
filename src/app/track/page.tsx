import React, { Suspense } from "react";
import type { Metadata } from "next";
import { TrackingPortal } from "@/components/track/TrackingPortal";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "Track Fan Card | Kountry Wayne VIP",
  description:
    "Track your official commemorative Kountry Wayne Fan Card delivery status and milestone timeline with your private tracking code.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-dynamic";

function TrackingLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />
      <main className="flex-1 py-20 flex items-center justify-center">
        <Container size="md" className="text-center text-[#9E9EAF]">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Loading tracking portal...</p>
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<TrackingLoadingFallback />}>
      <TrackingPortal />
    </Suspense>
  );
}
