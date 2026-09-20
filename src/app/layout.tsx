import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip"
  ),
  title: {
    default: "Meet Kountry Wayne | Official VIP Meet & Greet Platform",
    template: "%s | Kountry Wayne VIP",
  },
  description:
    "Official Kountry Wayne VIP Meet & Greet platform and Fan Card tracking portal. Choose your tour stop, register for exclusive meet & greet access, and track commemorative physical Fan Card delivery.",
  keywords: [
    "Kountry Wayne",
    "Meet & Greet",
    "VIP Access",
    "Fan Card",
    "Tour Schedule",
    "Comedy Tour",
    "Fan Card Tracking",
  ],
  authors: [{ name: "Kountry Wayne Tour Operations Desk" }],
  creator: "Kountry Wayne Tour Management",
  publisher: "Kountry Wayne Entertainment",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Kountry Wayne VIP Experience",
    title: "Meet Kountry Wayne | Official VIP Meet & Greet Platform",
    description:
      "Choose your tour stop and request your exclusive opportunity to meet Kountry Wayne. Track your commemorative physical Fan Card delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Kountry Wayne | Official VIP Meet & Greet Platform",
    description:
      "Choose your tour stop and request your exclusive opportunity to meet Kountry Wayne.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-[#F8F8FC] antialiased selection:bg-[#D4AF37]/30 selection:text-[#F8F8FC] min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
