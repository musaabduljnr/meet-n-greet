import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveCities } from "@/lib/supabase/cities";
import { RegistrationWizard } from "@/components/register/RegistrationWizard";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "VIP Membership Registration | Kountry Wayne Fan Club",
  description:
    "Register for official Kountry Wayne VIP Membership. Receive your embossed physical Fan Card, nationwide VIP Meet & Greet cohort credentials, and priority access.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />
      <main className="flex-1 py-20 flex items-center justify-center">
        <Container size="md" className="text-center text-[#9E9EAF]">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Loading VIP membership portal...</p>
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}

export default async function RegisterPage() {
  const result = await getActiveCities();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegistrationWizard initialCities={result.cities} />
    </Suspense>
  );
}
