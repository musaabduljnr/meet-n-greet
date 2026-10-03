import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CardPreviewView } from "@/components/card-preview/CardPreviewView";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "Gold VIP Membership Card Preview | Kountry Wayne",
  description:
    "Official digital preview of your manufactured commemorative metal Kountry Wayne Gold VIP Fan Card.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function PreviewLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />
      <main className="flex-1 py-20 flex items-center justify-center">
        <Container size="md" className="text-center text-[#9E9EAF]">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Loading VIP Gold Card preview...</p>
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}

export default function CardPreviewPage() {
  return (
    <Suspense fallback={<PreviewLoadingFallback />}>
      <CardPreviewView />
    </Suspense>
  );
}
