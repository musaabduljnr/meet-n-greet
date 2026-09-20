"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  User,
  Clock,
  Send,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { City } from "@/types/database";
import {
  registrationInputSchema,
  normalizeName,
  normalizePhoneNumber,
} from "@/lib/validations/registration";
import type { RegistrationResult } from "@/lib/validations/registration";
import { registerFanAction } from "@/app/actions/register";

interface RegistrationWizardProps {
  initialCities: City[];
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  initialCities,
}) => {
  const searchParams = useSearchParams();
  const initialCityParam = searchParams.get("city") || "";

  // Only active/public cities
  const activeCities = initialCities.filter((c) => c.is_active);

  // Derive initial matched city synchronously without useEffect
  const matchedInitialCity = initialCityParam
    ? activeCities.find(
        (c) =>
          c.id === initialCityParam ||
          c.name.toLowerCase() === initialCityParam.toLowerCase()
      )
    : null;

  // Step state: 1 = City Selection, 2 = Form Details, 3 = Review, 4 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(
    matchedInitialCity ? 2 : 1
  );

  // Form state
  const [selectedCityId, setSelectedCityId] = useState<string>(
    matchedInitialCity ? matchedInitialCity.id : ""
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Validation & feedback state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation result
  const [confirmationData, setConfirmationData] = useState<
    RegistrationResult["data"] | null
  >(null);

  const selectedCity = activeCities.find((c) => c.id === selectedCityId);

  // Validate Step 2 inputs before moving to Review (Step 3)
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmissionError(null);

    const validation = registrationInputSchema.safeParse({
      cityId: selectedCityId,
      firstName,
      lastName,
      email,
      phone,
      notes,
      website_hp: honeypot,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        errors[issue.path.join(".")] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setCurrentStep(3);
  };

  // Submit to Server Action
  const handleSubmitRegistration = async () => {
    if (isSubmitting || confirmationData) return; // Prevent duplicate submissions

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await registerFanAction({
        cityId: selectedCityId,
        firstName,
        lastName,
        email,
        phone,
        notes,
        website_hp: honeypot,
      });

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
          setCurrentStep(2); // Go back to fix fields
        }
        setSubmissionError(result.message);
        return;
      }

      // Success
      setConfirmationData(result.data);
      setCurrentStep(4);
    } catch {
      setSubmissionError("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1 py-12 md:py-20">
        <Container size="md">
          {/* ================================================================= */}
          {/* STEP 4: CONFIRMATION PAGE                                         */}
          {/* ================================================================= */}
          {currentStep === 4 && confirmationData ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  VIP Request Submitted
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                  You&apos;re Registered
                </h1>
                <p className="text-sm text-[#9E9EAF] mt-2 max-w-md mx-auto">
                  Thank you, {normalizeName(firstName)}. Your VIP Meet & Greet request has been received by tour operations.
                </p>
              </div>

              <Card className="border-[#D4AF37]/30 shadow-2xl">
                <CardHeader className="border-b border-[#1E1E28]">
                  <div className="flex items-center justify-between">
                    <CardTitle>Registration Reference</CardTitle>
                    <span className="font-mono text-xs font-bold text-[#D4AF37] px-3 py-1 rounded bg-[#181820] border border-[#2A2A38]">
                      {confirmationData.confirmationReference}
                    </span>
                  </div>
                  <CardDescription>
                    Please save this reference ID for any communication with our tour desk.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-lg bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Selected Tour City
                      </span>
                      <p className="text-sm font-semibold text-[#F8F8FC] mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                        <span>{confirmationData.cityName}, {confirmationData.cityState}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Registered Email
                      </span>
                      <p className="text-sm font-semibold text-[#F8F8FC] mt-1 flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                        <span>{confirmationData.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-[#181820] border border-[#2A2A38]">
                      <Clock className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs">
                        <h4 className="font-semibold text-white mb-1">Meet & Greet Scheduling Notice</h4>
                        <p className="text-[#9E9EAF] leading-relaxed">
                          Your designated arrival time slot, secret venue check-in entrance, and arrival guidelines will be communicated to you by email after tour coordinators finalize logistics for {confirmationData.cityName}.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-[#181820] border border-[#2A2A38]">
                      <ShieldCheck className="h-5 w-5 text-[#34D399] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs">
                        <h4 className="font-semibold text-white mb-1">Private Fan Card Tracking Details</h4>
                        <p className="text-[#9E9EAF] leading-relaxed">
                          Your private Fan Card tracking code and fulfillment link have been sent directly to your email address (<strong>{confirmationData.email}</strong>). To safeguard your VIP privacy, public tracking codes are never exposed on public pages.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="secondary" size="md" className="w-full">
                      Return to Homepage
                    </Button>
                  </Link>

                  <Link href="/#faq" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" className="w-full">
                      View Guest FAQ
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          ) : (
            /* =============================================================== */
            /* STEPS 1, 2, 3                                                   */
            /* =============================================================== */
            <div className="space-y-8">
              {/* Stepper Progress Bar */}
              <div className="flex items-center justify-between border-b border-[#1E1E28] pb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 1
                        ? "bg-[#D4AF37] text-black"
                        : "bg-[#181820] text-[#9E9EAF] border border-[#2A2A38]"
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={`text-xs uppercase font-medium tracking-wider hidden sm:inline ${
                      currentStep === 1 ? "text-white" : "text-[#6B6B7E]"
                    }`}
                  >
                    Select City
                  </span>

                  <div className="h-px w-8 bg-[#2A2A38] hidden sm:block" />

                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 2
                        ? "bg-[#D4AF37] text-black"
                        : "bg-[#181820] text-[#9E9EAF] border border-[#2A2A38]"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-xs uppercase font-medium tracking-wider hidden sm:inline ${
                      currentStep === 2 ? "text-white" : "text-[#6B6B7E]"
                    }`}
                  >
                    Fan Information
                  </span>

                  <div className="h-px w-8 bg-[#2A2A38] hidden sm:block" />

                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 3
                        ? "bg-[#D4AF37] text-black"
                        : "bg-[#181820] text-[#9E9EAF] border border-[#2A2A38]"
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`text-xs uppercase font-medium tracking-wider hidden sm:inline ${
                      currentStep === 3 ? "text-white" : "text-[#6B6B7E]"
                    }`}
                  >
                    Review & Submit
                  </span>
                </div>

                <span className="text-xs font-mono text-[#D4AF37]">
                  Step {currentStep} of 3
                </span>
              </div>

              {/* Error Banner */}
              {submissionError && (
                <Alert
                  variant="error"
                  title="Registration Notice"
                  onDismiss={() => setSubmissionError(null)}
                >
                  {submissionError}
                </Alert>
              )}

              {/* ============================================================= */}
              {/* STEP 1: CITY SELECTION                                        */}
              {/* ============================================================= */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 1 of 3
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Choose Your Tour City
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Select your desired tour stop to request an opportunity to meet Wayne.
                    </p>
                  </div>

                  {activeCities.length === 0 ? (
                    <EmptyState
                      icon={<MapPin className="h-6 w-6 text-[#D4AF37]" />}
                      title="No Tour Stops Currently Active"
                      description="All cities are currently undergoing administrative scheduling. Please check back shortly."
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeCities.map((city) => {
                        const isSelected = selectedCityId === city.id;
                        const formattedDate = new Date(
                          `${city.tour_date}T12:00:00`
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        });

                        return (
                          <div
                            key={city.id}
                            onClick={() => {
                              setSelectedCityId(city.id);
                              setFieldErrors({});
                            }}
                            className={`
                              p-5 rounded-xl border cursor-pointer transition-all duration-200 text-left
                              ${
                                isSelected
                                  ? "bg-[#181820] border-[#D4AF37] ring-2 ring-[#D4AF37]/30"
                                  : "bg-[#111115] border-[#2A2A38] hover:border-[#3E3E52] hover:bg-[#141418]"
                              }
                            `}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setSelectedCityId(city.id);
                                setFieldErrors({});
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="success" size="sm" dot>
                                Requests Open
                              </Badge>
                              {isSelected && (
                                <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                                  Selected
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-[#F8F8FC]">
                              {city.name}, {city.state}
                            </h3>

                            {city.venue_name && (
                              <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
                                {city.venue_name}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-[#9E9EAF] mt-2">
                              <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                              <span>{formattedDate}</span>
                            </div>

                            {city.notes && (
                              <p className="text-[11px] text-[#6B6B7E] mt-2 line-clamp-1">
                                {city.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {fieldErrors.cityId && (
                    <p className="text-xs text-[#EF4444]" role="alert">
                      {fieldErrors.cityId}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#1E1E28]">
                    <Link href="/">
                      <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                        Back to Home
                      </Button>
                    </Link>

                    <Button
                      variant="primary"
                      size="md"
                      disabled={!selectedCityId}
                      onClick={() => setCurrentStep(2)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Fan Info
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 2: REGISTRATION FORM                                     */}
              {/* ============================================================= */}
              {currentStep === 2 && selectedCity && (
                <form onSubmit={handleProceedToReview} className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 2 of 3
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Fan Information
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Please enter your contact details. Information is used strictly for VIP verification and communication.
                    </p>
                  </div>

                  {/* Selected City Pill */}
                  <div className="p-4 rounded-xl bg-[#181820] border border-[#2A2A38] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[#111115] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-[#9E9EAF]">
                          Selected Tour Stop
                        </span>
                        <h4 className="text-sm font-semibold text-[#F8F8FC]">
                          {selectedCity.name}, {selectedCity.state} ({new Date(`${selectedCity.tour_date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
                        </h4>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Change
                    </Button>
                  </div>

                  {/* Contact Fields */}
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="First Legal Name"
                          placeholder="e.g. Marcus"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          error={fieldErrors.firstName}
                          required
                          leftIcon={<User className="h-4 w-4" />}
                          helperText="Must match government photo ID presented at check-in."
                        />

                        <Input
                          label="Last Legal Name"
                          placeholder="e.g. Sterling"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          error={fieldErrors.lastName}
                          required
                          leftIcon={<User className="h-4 w-4" />}
                        />
                      </div>

                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="marcus@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={fieldErrors.email}
                        required
                        leftIcon={<Mail className="h-4 w-4" />}
                        helperText="Your private tracking code and schedule arrival details are sent here."
                      />

                      <Input
                        label="Mobile Phone Number"
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={fieldErrors.phone}
                        required
                        leftIcon={<Phone className="h-4 w-4" />}
                        helperText="Used for tour operations coordination and day-of-show updates."
                      />

                      <Textarea
                        label="Special Notes or Accessibility Needs (Optional)"
                        placeholder="Any special assistance or wheelchair access requirements for the tour team..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        error={fieldErrors.notes}
                        rows={3}
                      />

                      {/* Honeypot field (hidden from legitimate users) */}
                      <input
                        type="text"
                        name="website_hp"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        style={{ display: "none" }}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                      />
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between pt-4 border-t border-[#1E1E28]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(1)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to Cities
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Review Registration
                    </Button>
                  </div>
                </form>
              )}

              {/* ============================================================= */}
              {/* STEP 3: REVIEW & CONFIRM                                      */}
              {/* ============================================================= */}
              {currentStep === 3 && selectedCity && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 3 of 3
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Review Your Request
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Please confirm your information before submitting to tour operations.
                    </p>
                  </div>

                  <Card>
                    <CardHeader className="border-b border-[#1E1E28]">
                      <CardTitle>Registration Summary</CardTitle>
                      <CardDescription>
                        Review all details. Legal name must match your government photo ID.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-lg bg-[#181820] border border-[#1E1E28]">
                          <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                            Selected Tour Stop
                          </span>
                          <p className="text-sm font-semibold text-[#F8F8FC] mt-1">
                            {selectedCity.name}, {selectedCity.state}
                          </p>
                          <p className="text-xs text-[#D4AF37] mt-0.5">
                            {new Date(`${selectedCity.tour_date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#181820] border border-[#1E1E28]">
                          <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                            Full Legal Name
                          </span>
                          <p className="text-sm font-semibold text-[#F8F8FC] mt-1">
                            {normalizeName(firstName)} {normalizeName(lastName)}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#181820] border border-[#1E1E28]">
                          <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                            Contact Email
                          </span>
                          <p className="text-sm font-semibold text-[#F8F8FC] mt-1 truncate">
                            {email.trim().toLowerCase()}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#181820] border border-[#1E1E28]">
                          <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                            Mobile Phone
                          </span>
                          <p className="text-sm font-semibold text-[#F8F8FC] mt-1">
                            {normalizePhoneNumber(phone)}
                          </p>
                        </div>
                      </div>

                      {notes && (
                        <div className="p-4 rounded-lg bg-[#181820] border border-[#1E1E28] text-xs">
                          <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                            Special Notes / Accessibility Requests
                          </span>
                          <p className="text-[#F8F8FC] mt-1 italic leading-relaxed">
                            &quot;{notes}&quot;
                          </p>
                        </div>
                      )}

                      <Alert variant="info" title="Tour Process Clarity">
                        By submitting, you are requesting a spot in the {selectedCity.name} VIP Meet & Greet cohort. This is not an automated ticket. Your exact arrival time slot and confidential stage-door entrance will be communicated by email.
                      </Alert>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        disabled={isSubmitting}
                        onClick={() => setCurrentStep(2)}
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                      >
                        Edit Details
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleSubmitRegistration}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        {isSubmitting ? "Submitting..." : "Confirm & Submit Registration"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          )}
        </Container>
      </main>

      <PublicFooter />
    </div>
  );
};
