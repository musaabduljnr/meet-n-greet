import type { Metadata } from "next";
import { getActiveCities } from "@/lib/supabase/cities";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = {
  title: "Meet Kountry Wayne | Official Meet & Greet Experience",
  description:
    "Choose your city and request your opportunity to meet Wayne. Your meeting details will be communicated to you by email. Track your commemorative Fan Card delivery.",
  keywords: [
    "Kountry Wayne",
    "Meet and Greet",
    "VIP Experience",
    "Fan Card",
    "Wayne Colley",
    "Comedy Tour",
    "VIP Access",
  ],
  authors: [{ name: "Tour Operations" }],
  openGraph: {
    title: "Meet Kountry Wayne | Official Meet & Greet Experience",
    description:
      "Choose your city and request your opportunity to meet Wayne. Your meeting details will be communicated to you by email.",
    type: "website",
    locale: "en_US",
    siteName: "Kountry Wayne VIP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Kountry Wayne | Official Meet & Greet Experience",
    description:
      "Choose your city and request your opportunity to meet Wayne. Your meeting details will be communicated to you by email.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getActiveCities();

  return (
    <HomeView
      initialCities={result.cities}
      isLiveSupabase={result.isLive}
      initialError={result.error}
    />
  );
}
