"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  MapPin,
  ChevronDown,
  Mail,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { City } from "@/types/database";

interface HomeViewProps {
  initialCities: City[];
  isLiveSupabase: boolean;
  initialError?: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  initialCities,
  isLiveSupabase,
  initialError = null,
}) => {
  const router = useRouter();

  // Tracking section state
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingError, setTrackingError] = useState("");

  // Cities data state
  const [cities, setCities] = useState<City[]>(initialCities);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(initialError);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact form state
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Handle tracking form submission
  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = trackingCode.trim().toUpperCase();

    if (!cleanCode) {
      setTrackingError("Please enter your Fan Card Tracking Code.");
      return;
    }

    // Accepts either KWFC-XXXX-XXXX or KW-XXXX-XXXX formats
    const isValidFormat =
      cleanCode.startsWith("KWFC-") || cleanCode.startsWith("KW-");

    if (!isValidFormat || cleanCode.length < 9) {
      setTrackingError(
        "Invalid format. Tracking code should be like KWFC-XXXX-XXXX or KW-XXXX-XXXX."
      );
      return;
    }

    setTrackingError("");
    // Route to private tracking page without disclosing PII on public homepage
    router.push(`/track?code=${encodeURIComponent(cleanCode)}`);
  };

  // Refresh cities from API
  const refreshCities = async () => {
    setIsLoadingCities(true);
    setCitiesError(null);
    try {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error("Could not refresh tour cities.");
      const json = await res.json();
      setCities(json.cities || []);
    } catch (err: unknown) {
      setCitiesError(err instanceof Error ? err.message : "Error loading cities");
    } finally {
      setIsLoadingCities(false);
    }
  };

  const faqItems = [
    {
      q: "Is this a traditional ticket-selling platform?",
      a: "No. This is not a conventional concert or comedy ticket checkout. This dedicated portal is specifically for requesting an exclusive VIP Meet & Greet opportunity and managing your physical commemorative Fan Card fulfillment. Main show admission tickets are sold separately via official venue box offices.",
    },
    {
      q: "When and how will I receive my Meet & Greet schedule?",
      a: "Because this experience is thoughtfully organized in small, relaxed cohorts rather than a rushed photo line, your exact arrival time, private venue check-in coordinates, and stage-door directions will be communicated to you by email after tour coordinators finalize scheduling for your city.",
    },
    {
      q: "What is the Fan Card?",
      a: "Every registered VIP guest is issued an official, embossed commemorative physical Fan Card delivered to your shipping address. You receive a private tracking code immediately upon registration so you can follow its fulfillment and shipment progress.",
    },
    {
      q: "Can I transfer my registration or Fan Card to someone else?",
      a: "To ensure safety, venue security, and an intimate VIP environment, all registrations are non-transferable and must match the government-issued photo ID presented at check-in.",
    },
    {
      q: "What should I bring to the Meet & Greet?",
      a: "Please bring a valid government photo ID matching your registered legal name and have your private tracking code ready on your phone.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1">
        {/* ================================================================= */}
        {/* 1. HERO SECTION                                                   */}
        {/* ================================================================= */}
        <section className="relative pt-16 pb-20 md:pt-28 md:pb-32 border-b border-[#1E1E28] overflow-hidden">
          {/* Subtle gold atmospheric glow */}
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#D4AF37]/5 blur-[140px] rounded-full pointer-events-none"
            aria-hidden="true"
          />

          <Container size="lg" className="relative z-10 text-center">
            {/* VIP Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181820] border border-[#D4AF37]/30 text-xs font-medium text-[#F3E5AB] mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
              <span>VIP Experience & Commemorative Fan Card Program</span>
            </div>

            {/* Primary Message */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F8F8FC] uppercase max-w-4xl mx-auto leading-[1.08]">
              Meet Kountry Wayne
            </h1>

            {/* Supporting Message */}
            <p className="mt-6 text-base sm:text-lg text-[#9E9EAF] max-w-2xl mx-auto leading-relaxed">
              Choose your city and request your opportunity to meet Wayne. Your meeting details will be communicated to you by email.
            </p>

            {/* Primary CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#available-cities">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<MapPin className="h-4 w-4" />}
                >
                  Choose Your City
                </Button>
              </a>
              <a href="#tracking-section">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<CreditCard className="h-4 w-4" />}
                >
                  Track Existing Card
                </Button>
              </a>
            </div>

            {/* Platform Clarity Banner */}
            <div className="mt-12 max-w-xl mx-auto p-4 rounded-xl bg-[#111115]/90 border border-[#2A2A38] text-left flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-[#9E9EAF] leading-relaxed">
                <strong className="text-[#F8F8FC] font-semibold">Curated VIP Access:</strong> This is an intimate Meet & Greet opportunity, not a mass-admission ticketing line. Cohorts are reviewed by tour operations and confirmed via direct email.
              </p>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 2. MEET & GREET CTA SECTION                                       */}
        {/* ================================================================= */}
        <section className="py-16 border-b border-[#1E1E28] bg-[#0E0E12]">
          <Container size="xl">
            <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-[#181820] to-[#111115] border border-[#2A2A38] relative overflow-hidden">
              <div className="max-w-2xl">
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Exclusive Guest Roster
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-2">
                  Request Your Opportunity to Meet Wayne
                </h2>
                <p className="text-sm text-[#9E9EAF] mt-3 leading-relaxed">
                  Select your tour stop, provide your mailing address for your physical Fan Card, and submit your registration request. Once reviewed by our team, your scheduled time slot, venue check-in entrance, and arrival guidelines will arrive directly in your inbox.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <a href="#available-cities">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Choose Your City
                    </Button>
                  </a>
                  <a href="#how-it-works">
                    <Button variant="outline" size="md">
                      How It Works
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 3. "ALREADY REGISTERED?" FAN CARD TRACKING SECTION                 */}
        {/* ================================================================= */}
        <section id="tracking-section" className="py-20 border-b border-[#1E1E28] bg-[#09090B]">
          <Container size="md">
            <div className="text-center mb-8">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Already registered?
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                Track your Fan Card delivery
              </h2>
              <p className="text-sm text-[#9E9EAF] mt-2 max-w-md mx-auto">
                Enter the private tracking code sent to your email to check your latest Fan Card delivery status.
              </p>
            </div>

            <Card className="shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleTrackingSubmit} className="space-y-4">
                  <Input
                    label="Fan Card Tracking Code"
                    placeholder="KWFC-XXXX-XXXX"
                    value={trackingCode}
                    onChange={(e) => {
                      setTrackingCode(e.target.value);
                      setTrackingError("");
                    }}
                    error={trackingError}
                    helperText="Check your registration confirmation email for your private alphanumeric code."
                    leftIcon={<Search className="h-4 w-4" />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    Track Fan Card
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-[#1E1E28] flex items-center justify-between text-xs text-[#6B6B7E]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                    <span>Zero PII disclosed publicly</span>
                  </span>
                  <Link href="#faq" className="hover:text-[#F8F8FC] underline transition-colors">
                    Lost your code?
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 4. HOW IT WORKS                                                   */}
        {/* ================================================================= */}
        <section id="how-it-works" className="py-24 border-b border-[#1E1E28] bg-[#0C0C0F]">
          <Container size="xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Step-by-Step Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                How It Works
              </h2>
              <p className="text-sm text-[#9E9EAF] mt-2">
                Designed from the ground up to eliminate ticket scalping and chaotic queues.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <Card hoverable className="relative p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-full bg-[#181820] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm mb-2">
                    1
                  </div>
                  <CardTitle className="text-lg">Choose Your City</CardTitle>
                  <CardDescription>
                    Select an active tour stop and submit your legal contact info and physical shipping address.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 2 */}
              <Card hoverable className="relative p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-full bg-[#181820] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm mb-2">
                    2
                  </div>
                  <CardTitle className="text-lg">Receive Tracking Code</CardTitle>
                  <CardDescription>
                    Get a private, cryptographically generated Fan Card code instantly delivered to your verified email.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 3 */}
              <Card hoverable className="relative p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-full bg-[#181820] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm mb-2">
                    3
                  </div>
                  <CardTitle className="text-lg">Curated Scheduling</CardTitle>
                  <CardDescription>
                    Tour coordinators schedule your arrival slot, confidential stage door entrance, and instructions via email.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 4 */}
              <Card hoverable className="relative p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-full bg-[#181820] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm mb-2">
                    4
                  </div>
                  <CardTitle className="text-lg">Track & Attend</CardTitle>
                  <CardDescription>
                    Follow your physical Fan Card delivery online, then arrive with your photo ID for an unforgettable meeting.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 5. AVAILABLE CITIES PREVIEW (Driven dynamically by Supabase)      */}
        {/* ================================================================= */}
        <section id="available-cities" className="py-24 border-b border-[#1E1E28]">
          <Container size="xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Tour Stops
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                  Available Tour Cities
                </h2>
                <p className="text-sm text-[#9E9EAF] mt-1">
                  {isLiveSupabase
                    ? "Live tour dates synchronized directly from tour operations database."
                    : "Published tour schedule open for guest requests."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshCities}
                  isLoading={isLoadingCities}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Refresh Schedule
                </Button>
                <Link href="/register">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error State */}
            {citiesError && (
              <div className="mb-8">
                <Alert
                  variant="warning"
                  title="Notice loading tour schedule"
                  onDismiss={() => setCitiesError(null)}
                >
                  {citiesError}. Showing cached tour stops.
                </Alert>
              </div>
            )}

            {/* Loading State */}
            {isLoadingCities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </Card>
                ))}
              </div>
            ) : cities.length === 0 ? (
              /* Empty State */
              <EmptyState
                icon={<MapPin className="h-6 w-6 text-[#D4AF37]" />}
                title="No Tour Stops Currently Active"
                description="Upcoming tour stops are currently being curated by tour management. Please check back soon or join our notification list."
                action={
                  <Button variant="secondary" size="sm" onClick={refreshCities}>
                    Check Again
                  </Button>
                }
              />
            ) : (
              /* Responsive Cities Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cities.map((city) => {
                  const isNearCapacity =
                    city.current_registrations_count >= city.max_capacity * 0.8;
                  const isFull =
                    city.current_registrations_count >= city.max_capacity;

                  // Format readable date
                  const formattedDate = new Date(
                    `${city.tour_date}T12:00:00`
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <Card
                      key={city.id}
                      hoverable
                      className="flex flex-col justify-between border-[#2A2A38]"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Badge
                            variant={
                              isFull
                                ? "error"
                                : isNearCapacity
                                ? "warning"
                                : "success"
                            }
                            size="sm"
                            dot
                          >
                            {isFull
                              ? "Cohort Full"
                              : isNearCapacity
                              ? "Limited Openings"
                              : "Requests Open"}
                          </Badge>

                          <span className="text-[11px] font-mono text-[#6B6B7E]">
                            Capacity: {city.max_capacity} Guests
                          </span>
                        </div>

                        <CardTitle className="text-2xl">
                          {city.name}, {city.state}
                        </CardTitle>

                        <p className="text-sm font-medium text-[#D4AF37] mt-1">
                          {city.venue_name || "Venue to be announced"}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-[#9E9EAF] mt-3">
                          <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                          <span>{formattedDate}</span>
                        </div>

                        {city.notes && (
                          <p className="text-xs text-[#6B6B7E] mt-2 line-clamp-2">
                            {city.notes}
                          </p>
                        )}
                      </CardHeader>

                      <CardFooter className="pt-2 bg-transparent border-t-0">
                        <Link
                          href={`/register?city=${encodeURIComponent(city.id)}`}
                          className="w-full"
                        >
                          <Button
                            variant={isFull ? "outline" : "primary"}
                            size="md"
                            className="w-full"
                            disabled={isFull}
                          >
                            {isFull ? "Capacity Reached" : "Select City & Request"}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 6. ABOUT KOUNTRY WAYNE                                            */}
        {/* ================================================================= */}
        <section className="py-24 border-b border-[#1E1E28] bg-[#0E0E12]">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-[#2A2A38] bg-[#181820] p-8 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#2A2A38] pb-4 mb-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Headline Entertainer
                    </span>
                    <span className="text-xs font-mono text-[#9E9EAF]">
                      National Tour
                    </span>
                  </div>

                  <h3 className="text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase">
                    Kountry Wayne
                  </h3>
                  <p className="text-sm font-semibold text-[#D4AF37] mt-1">
                    Wayne Colley
                  </p>

                  <p className="text-xs text-[#9E9EAF] mt-4 leading-relaxed">
                    Comedian &bull; Author &bull; Actor &bull; Content Creator
                  </p>

                  <div className="mt-8 pt-6 border-t border-[#2A2A38] space-y-3 text-xs text-[#9E9EAF]">
                    <div className="flex items-center justify-between">
                      <span>Bestselling Author</span>
                      <span className="text-white font-medium">Help Is on the Way</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Digital Reach</span>
                      <span className="text-white font-medium">Over 10M+ Community</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Format</span>
                      <span className="text-white font-medium">Curated VIP Meet & Greets</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  The VIP Experience
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase">
                  Personal Connection, <br />
                  <span className="text-[#D4AF37]">Not a Rushed Line</span>
                </h2>

                <p className="text-sm text-[#9E9EAF] leading-relaxed">
                  Wayne Colley—widely known as Kountry Wayne—has captivated millions worldwide with his authentic humor, genuine faith, and relatable everyday storytelling. From viral skits to sold-out theaters across North America, his connection with his audience is personal.
                </p>

                <p className="text-sm text-[#9E9EAF] leading-relaxed">
                  That genuine connection is why this platform exists. Rather than herding hundreds of fans through a frantic, rushed assembly line, our Meet & Greet stops are organized into carefully managed cohorts. You receive personal time with Wayne, individual photos, and a commemorative metal Fan Card to remember the night.
                </p>

                <div className="pt-4">
                  <a href="#available-cities">
                    <Button variant="primary" size="md" rightIcon={<MapPin className="h-4 w-4" />}>
                      Choose Your City
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 7. FAQ SECTION                                                    */}
        {/* ================================================================= */}
        <section id="faq" className="py-24 border-b border-[#1E1E28]">
          <Container size="md">
            <div className="text-center mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Everything You Need to Know
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[#9E9EAF] mt-2">
                Have questions about your registration, Fan Card, or Meet & Greet schedule?
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#2A2A38] bg-[#111115] overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-[#F8F8FC]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-[#9E9EAF] leading-relaxed border-t border-[#1E1E28]">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ================================================================= */}
        {/* 8. SUPPORT & CONTACT SECTION                                      */}
        {/* ================================================================= */}
        <section id="support" className="py-24 bg-[#09090B]">
          <Container size="md">
            <div className="text-center mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                Guest Assistance
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                Tour Operations Support
              </h2>
              <p className="text-sm text-[#9E9EAF] mt-2">
                Need help locating your tracking code or have a special accessibility inquiry for your tour city?
              </p>
            </div>

            <Card>
              <CardContent className="p-6 sm:p-8">
                {supportSubmitted ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#F8F8FC]">
                      Support Request Received
                    </h3>
                    <p className="text-xs text-[#9E9EAF] mt-2 max-w-sm mx-auto">
                      Our tour coordination desk will review your inquiry and follow up via email within 24 to 48 hours.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-6"
                      onClick={() => setSupportSubmitted(false)}
                    >
                      Send Another Inquiry
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSupportSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        placeholder="e.g. Marcus Sterling"
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        required
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="marcus@example.com"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Input
                      label="Fan Card Tracking Code (If Applicable)"
                      placeholder="KWFC-XXXX-XXXX"
                    />

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1">
                        Inquiry Details <span className="text-[#D4AF37]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Please describe your question or accessibility request for the tour team..."
                        className="w-full rounded-md bg-[#111115] text-[#F8F8FC] placeholder:text-[#6B6B7E] text-sm p-3.5 border border-[#2A2A38] focus:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      leftIcon={<Mail className="h-4 w-4" />}
                    >
                      Submit Support Inquiry
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </Container>
        </section>
      </main>

      {/* ================================================================= */}
      {/* 9. FOOTER                                                         */}
      {/* ================================================================= */}
      <PublicFooter />
    </div>
  );
};
