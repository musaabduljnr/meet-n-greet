"use client";

import React, { useState, useId } from "react";
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
  Crown,
  Home,
  FileCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { IdUpload, type UploadedIdFile } from "@/components/ui/IdUpload";
import { City } from "@/types/database";
import {
  registrationInputSchema,
  normalizeName,
  normalizePhoneNumber,
} from "@/lib/validations/registration";
import type { RegistrationResult } from "@/lib/validations/registration";
import { registerFanAction } from "@/app/actions/register";
import { getUSStates, getCitiesForState } from "@/lib/data/us-states-cities";

interface RegistrationWizardProps {
  initialCities?: City[];
}

export const MEMBERSHIP_TIERS = [
  {
    id: "GOLD_VIP",
    name: "Gold VIP Meet & Greet",
    badge: "Most Popular",
    price: "Official Access",
    description: "Intimate cohort Meet & Greet, professional photo with Kountry Wayne, and official embossed physical Fan Card.",
  },
  {
    id: "DIAMOND_VIP",
    name: "Diamond All-Access VIP",
    badge: "Exclusive Cohort",
    price: "Priority Call Time",
    description: "Priority green-room cohort entry, extended meeting time, limited edition engraved Fan Card, and signed tour commemorative.",
  },
  {
    id: "SILVER_MEMBER",
    name: "Fan Club Commemorative Pass",
    badge: "Fan Supporter",
    price: "Fulfillment Only",
    description: "Official customized physical Fan Card delivered to your door and guaranteed priority notifications for future tour dates.",
  },
];

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  initialCities = [],
}) => {
  const searchParams = useSearchParams();
  const initialCityParam = searchParams.get("city") || "";

  // Only active/public cities
  const activeCities = initialCities.filter((c) => c.is_active);

  // Derive initial matched city synchronously without useEffect (optional preference)
  const matchedInitialCity = initialCityParam
    ? activeCities.find(
        (c) =>
          c.id === initialCityParam ||
          c.name.toLowerCase() === initialCityParam.toLowerCase()
      )
    : null;

  // Step state:
  // 1 = VIP Membership Tier & Pass
  // 2 = Fan Personal Information
  // 3 = Shipping & Residential Address (Complete USA State & Cities Dropdown)
  // 4 = Government Photo ID Upload
  // 5 = Review & Confirm
  // 6 = Confirmation Receipt
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Membership Tier (Default: GOLD_VIP) & Optional Tour Stop Preference
  const [membershipTier, setMembershipTier] = useState<string>("GOLD_VIP");
  const [selectedCityId, setSelectedCityId] = useState<string>(
    matchedInitialCity ? matchedInitialCity.id : ""
  );

  // Step 2: Personal Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Step 3: Address & USA State/Cities Dropdowns
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  const [customCityName, setCustomCityName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step 4: Valid ID Upload
  const [idType, setIdType] = useState("DRIVERS_LICENSE");
  const [idNumber, setIdNumber] = useState("");
  const [uploadedIdFile, setUploadedIdFile] = useState<UploadedIdFile | null>(null);
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Step 5: Consents
  const [certifyIdentity, setCertifyIdentity] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Validation & feedback state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation result
  const [confirmationData, setConfirmationData] = useState<
    RegistrationResult["data"] | null
  >(null);

  const selectedTourCity = activeCities.find((c) => c.id === selectedCityId);

  // USA States list for dropdown
  const usStates = getUSStates();
  const usStateOptions = usStates.map((s) => ({
    value: s.code,
    label: `${s.name} (${s.code})`,
  }));

  // Dependent USA Cities list based on selected state
  const citiesForSelectedState = selectedState ? getCitiesForState(selectedState) : [];
  const cityOptions = [
    ...citiesForSelectedState.map((cityName) => ({
      value: cityName,
      label: cityName,
    })),
    { value: "OTHER_CUSTOM", label: "Other (Type custom city name)" },
  ];

  const effectiveCity =
    selectedCityName === "OTHER_CUSTOM" ? customCityName.trim() : selectedCityName;

  // ---------------------------------------------------------------------------
  // Step Validation Handlers
  // ---------------------------------------------------------------------------

  // Validate Step 1 -> Step 2
  const handleProceedFromStep1 = () => {
    setFieldErrors({});
    if (!membershipTier) {
      setFieldErrors({ membershipTier: "Please select a VIP membership tier." });
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validate Step 2 -> Step 3
  const handleProceedFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "First legal name is required.";
    else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
      errors.firstName = "First name contains invalid characters.";
    }

    if (!lastName.trim()) errors.lastName = "Last legal name is required.";
    else if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      errors.lastName = "Last name contains invalid characters.";
    }

    if (!email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) errors.phone = "Mobile phone number is required.";
    else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required for VIP age verification.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validate Step 3 -> Step 4
  const handleProceedFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (!addressLine1.trim()) {
      errors.addressLine1 = "Street address is required for Fan Card fulfillment.";
    }

    if (!selectedState) {
      errors.state = "Please select a US State from the dropdown.";
    }

    if (!selectedCityName) {
      errors.city = "Please select a City from the dropdown.";
    } else if (selectedCityName === "OTHER_CUSTOM" && !customCityName.trim()) {
      errors.city = "Please enter your city name.";
    }

    const zipDigits = postalCode.replace(/\D/g, "");
    if (!postalCode.trim()) {
      errors.postalCode = "ZIP / Postal Code is required.";
    } else if (zipDigits.length < 5) {
      errors.postalCode = "Please enter a valid 5-digit US ZIP Code.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validate Step 4 -> Step 5
  const handleProceedFromStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (!idType) {
      errors.idType = "Please select a government ID type.";
    }

    if (!uploadedIdFile) {
      errors.idFile = "A valid government photo ID document is required for VIP verification.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 5: Final Review & Submission
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || confirmationData) return;

    setFieldErrors({});
    setSubmissionError(null);

    const errors: Record<string, string> = {};
    if (!certifyIdentity) {
      errors.certifyIdentity = "You must certify that your legal details and uploaded ID are authentic.";
    }
    if (!agreeTerms) {
      errors.agreeTerms = "You must agree to the VIP Code of Conduct and delivery guidelines.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerFanAction({
        cityId: selectedCityId,
        membershipTier,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        addressLine1,
        addressLine2,
        state: selectedState,
        city: effectiveCity,
        postalCode,
        idType,
        idNumber,
        idDocumentName: uploadedIdFile?.name || "",
        idDocumentUrl: uploadedIdFile?.dataUrl || "",
        notes,
        website_hp: honeypot,
      });

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        setSubmissionError(result.message);
        return;
      }

      // Success -> move to confirmation step
      setConfirmationData(result.data);
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmissionError("Network communication error. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: "VIP Tier" },
    { num: 2, label: "Personal Info" },
    { num: 3, label: "Address & City" },
    { num: 4, label: "Valid ID" },
    { num: 5, label: "Review & Submit" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1 py-10 md:py-16">
        <Container size="md">
          {/* ================================================================= */}
          {/* STEP 6: CONFIRMATION RECEIPT                                      */}
          {/* ================================================================= */}
          {currentStep === 6 && confirmationData ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Registration Confirmed
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                  VIP Membership Active
                </h1>
                <p className="text-sm text-[#9E9EAF] mt-2 max-w-md mx-auto">
                  Welcome to the VIP Guest Roster, {normalizeName(firstName)}. Your registration and photo ID verification have been submitted.
                </p>
              </div>

              <Card className="border-[#D4AF37]/40 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-[#1E1E28] bg-gradient-to-r from-[#181820] to-[#111115]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">
                        VIP Reference ID
                      </span>
                      <h2 className="text-xl font-bold font-mono text-white mt-0.5">
                        {confirmationData.confirmationReference}
                      </h2>
                    </div>
                    <Badge variant="success" size="md" dot>
                      Verified Request
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    Please keep this reference code for entrance door coordinates and VIP desk communication.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 text-sm">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Membership Tier & Scope
                      </span>
                      <p className="text-sm font-semibold text-[#F8F8FC] mt-1 flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                        <span>{MEMBERSHIP_TIERS.find((t) => t.id === membershipTier)?.name}</span>
                      </p>
                      <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5">
                        {confirmationData.cityName === "National VIP Member"
                          ? "Nationwide VIP Access Pass"
                          : `${confirmationData.cityName}, ${confirmationData.cityState}`}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Registered Attendee
                      </span>
                      <p className="text-sm font-semibold text-[#F8F8FC] mt-1 truncate">
                        {normalizeName(firstName)} {normalizeName(lastName)}
                      </p>
                      <p className="text-[11px] text-[#9E9EAF] truncate mt-0.5">
                        {confirmationData.email} &bull; {normalizePhoneNumber(phone)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Physical Delivery Address
                      </span>
                      <p className="text-xs font-semibold text-[#F8F8FC] mt-1">
                        {addressLine1} {addressLine2 ? `, ${addressLine2}` : ""}
                      </p>
                      <p className="text-[11px] text-[#9E9EAF]">
                        {effectiveCity}, {selectedState} {postalCode} (USA)
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111115] border border-[#1E1E28]">
                      <span className="text-[#6B6B7E] uppercase font-mono text-[10px]">
                        Valid ID Verification
                      </span>
                      <p className="text-xs font-semibold text-[#10B981] mt-1 flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Document Encrypted & Attached</span>
                      </p>
                      <p className="text-[11px] text-[#9E9EAF] truncate mt-0.5">
                        {uploadedIdFile?.name}
                      </p>
                    </div>
                  </div>

                  {/* Informational Alerts */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#181820] border border-[#2A2A38]">
                      <Clock className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs">
                        <h4 className="font-semibold text-white mb-1">Meet & Greet Cohort Arrival Times</h4>
                        <p className="text-[#9E9EAF] leading-relaxed">
                          Your specific arrival window, stage-door access coordinates, and host escort directions will be sent to your email address (<strong>{confirmationData.email}</strong>) prior to tour date.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#181820] border border-[#2A2A38]">
                      <ShieldCheck className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs">
                        <h4 className="font-semibold text-white mb-1">Commemorative Fan Card Shipment</h4>
                        <p className="text-[#9E9EAF] leading-relaxed">
                          Your physical Fan Card is being processed for minting. A private alphanumeric tracking code has been dispatched to your email for real-time status monitoring.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1E1E28] bg-[#0E0E12]">
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="secondary" size="md" className="w-full">
                      Return to Homepage
                    </Button>
                  </Link>

                  <Link href="/#tracking-section" className="w-full sm:w-auto">
                    <Button variant="outline" size="md" className="w-full">
                      Track Fan Card Delivery
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          ) : (
            /* =============================================================== */
            /* WIZARD PROGRESS BAR (STEPS 1 - 5)                               */
            /* =============================================================== */
            <div className="space-y-8">
              {/* Stepper Bar */}
              <div className="flex items-center justify-between border-b border-[#1E1E28] pb-6 overflow-x-auto">
                <div className="flex items-center gap-2 sm:gap-3 min-w-max">
                  {stepsMeta.map((s, idx) => {
                    const isPassed = currentStep > s.num;
                    const isCurrent = currentStep === s.num;

                    return (
                      <React.Fragment key={s.num}>
                        <div
                          className={`
                            h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${
                              isCurrent
                                ? "bg-[#D4AF37] text-black shadow-md ring-2 ring-[#D4AF37]/40"
                                : isPassed
                                ? "bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981]"
                                : "bg-[#181820] text-[#6B6B7E] border border-[#2A2A38]"
                            }
                          `}
                        >
                          {isPassed ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                        </div>

                        <span
                          className={`text-xs font-medium tracking-wider hidden md:inline ${
                            isCurrent
                              ? "text-white font-semibold"
                              : isPassed
                              ? "text-[#10B981]"
                              : "text-[#6B6B7E]"
                          }`}
                        >
                          {s.label}
                        </span>

                        {idx < stepsMeta.length - 1 && (
                          <div
                            className={`h-px w-4 sm:w-8 transition-colors ${
                              currentStep > s.num ? "bg-[#10B981]/50" : "bg-[#2A2A38]"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <span className="text-xs font-mono font-semibold text-[#D4AF37] ml-4 shrink-0">
                  Step {currentStep} of 5
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
              {/* STEP 1: VIP MEMBERSHIP TIER & ACCESS PASS                     */}
              {/* ============================================================= */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 1 of 5
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      VIP Membership Tier & Access Pass
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Select your VIP membership level. VIP Membership grants nationwide priority access, personalized physical Fan Card fulfillment, and exclusive Meet & Greet scheduling across all Kountry Wayne events.
                    </p>
                  </div>

                  {/* Nationwide VIP Access Notice Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/10 via-[#181820] to-[#111115] border border-[#D4AF37]/30 flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#D4AF37]">
                        Nationwide VIP Credentialing
                      </h4>
                      <p className="text-[#9E9EAF] mt-0.5 leading-relaxed">
                        VIP membership registration is independent of tour stop dates. Your authenticated credentials and commemorative embossed physical Fan Card provide VIP cohort check-in privileges across all official Kountry Wayne tour stops and special appearances nationwide.
                      </p>
                    </div>
                  </div>

                  {/* 1. VIP Membership Tier Selection */}
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center justify-between">
                      <span>Select VIP Membership Pass <span className="text-[#D4AF37]">*</span></span>
                      <span className="text-[11px] text-[#D4AF37] font-mono">Authentic VIP Credentials</span>
                    </label>

                    <div className="space-y-3.5">
                      {MEMBERSHIP_TIERS.map((tier) => {
                        const isSelected = membershipTier === tier.id;
                        return (
                          <div
                            key={tier.id}
                            onClick={() => {
                              setMembershipTier(tier.id);
                              setFieldErrors({});
                            }}
                            className={`
                              p-5 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden
                              ${
                                isSelected
                                  ? "bg-gradient-to-br from-[#1C1C24] to-[#121216] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xl"
                                  : "bg-[#111115] border-[#2A2A38] hover:border-[#3E3E52] hover:bg-[#141418]"
                              }
                            `}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setMembershipTier(tier.id);
                                setFieldErrors({});
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5">
                                <div
                                  className={`
                                    h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors
                                    ${
                                      isSelected
                                        ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                                        : "bg-[#181820] text-[#9E9EAF] border border-[#2A2A38]"
                                    }
                                  `}
                                >
                                  <Crown className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-white tracking-tight">
                                      {tier.name}
                                    </h3>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F3E5AB] font-semibold uppercase tracking-wider">
                                      {tier.badge}
                                    </span>
                                    {isSelected && (
                                      <Badge variant="success" size="sm" dot>
                                        Selected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#9E9EAF] max-w-xl leading-relaxed">
                                    {tier.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-[#1E1E28] shrink-0">
                                <span className="text-xs font-mono font-bold text-[#D4AF37] tracking-wider uppercase">
                                  {tier.price}
                                </span>
                                <span
                                  className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                                    isSelected ? "text-[#10B981]" : "text-[#6B6B7E]"
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Chosen Tier</span>
                                    </>
                                  ) : (
                                    "Click to Select"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {fieldErrors.membershipTier && (
                      <p className="text-xs text-[#EF4444]" role="alert">
                        {fieldErrors.membershipTier}
                      </p>
                    )}
                  </div>

                  {/* 2. Optional Tour Stop Preference (Disconnected & Non-blocking) */}
                  {activeCities.length > 0 && (
                    <div className="pt-2">
                      <div className="p-4 rounded-xl bg-[#111115] border border-[#2A2A38] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>Tour Stop Preference (Optional)</span>
                          </label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181820] border border-[#2A2A38] text-[#9E9EAF]">
                            Optional &bull; Non-mandatory
                          </span>
                        </div>
                        <p className="text-xs text-[#9E9EAF] leading-relaxed">
                          Your VIP Membership is nationwide by default. If you plan to attend a specific upcoming tour stop first, you may optionally indicate it below, or keep Nationwide All-Access.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCityId("")}
                            className={`p-3 rounded-lg border text-left text-xs transition-all ${
                              !selectedCityId
                                ? "bg-[#181820] border-[#D4AF37] text-white ring-1 ring-[#D4AF37]/40 shadow-sm"
                                : "bg-[#0E0E12] border-[#2A2A38] text-[#9E9EAF] hover:border-[#3E3E52]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                                Nationwide VIP All-Access
                              </span>
                              {!selectedCityId && (
                                <Badge variant="warning" size="sm">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B6B7E] mt-1">
                              Valid for any city and all future tour dates
                            </p>
                          </button>

                          {activeCities.map((city) => {
                            const isCitySelected = selectedCityId === city.id;
                            const formattedDate = new Date(
                              `${city.tour_date}T12:00:00`
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });

                            return (
                              <button
                                key={city.id}
                                type="button"
                                onClick={() => setSelectedCityId(city.id)}
                                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                                  isCitySelected
                                    ? "bg-[#181820] border-[#D4AF37] text-white ring-1 ring-[#D4AF37]/40 shadow-sm"
                                    : "bg-[#0E0E12] border-[#2A2A38] text-[#9E9EAF] hover:border-[#3E3E52]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-semibold">
                                    {city.name}, {city.state}
                                  </span>
                                  {isCitySelected && (
                                    <Badge variant="warning" size="sm">
                                      Preferred
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#6B6B7E] mt-1 truncate">
                                  {city.venue_name || "Tour Venue"} &bull; {formattedDate}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1 Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#1E1E28]">
                    <Link href="/">
                      <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                        Cancel & Return
                      </Button>
                    </Link>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleProceedFromStep1}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Personal Info
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 2: PERSONAL & CONTACT INFORMATION                         */}
              {/* ============================================================= */}
              {currentStep === 2 && (
                <form onSubmit={handleProceedFromStep2} className="space-y-6 animate-fadeIn">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 2 of 5
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Attendee Personal Details
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Legal names must match the government-issued photo ID presented at VIP cohort check-in.
                    </p>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3.5 rounded-xl bg-[#181820] border border-[#2A2A38] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-4 w-4 text-[#D4AF37]" />
                      <span className="text-xs text-[#F8F8FC] font-medium">
                        <span className="text-[#D4AF37] font-semibold">
                          {MEMBERSHIP_TIERS.find((t) => t.id === membershipTier)?.name}
                        </span>
                        <span className="text-[#9E9EAF] ml-1.5">
                          ({selectedTourCity ? `${selectedTourCity.name}, ${selectedTourCity.state}` : "Nationwide VIP Pass"})
                        </span>
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Change Tier
                    </Button>
                  </div>

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
                          helperText="Must match government photo ID."
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
                        helperText="Private Fan Card tracking links and secret arrival entrance details will arrive here."
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Mobile Phone Number"
                          type="tel"
                          placeholder="(555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          error={fieldErrors.phone}
                          required
                          leftIcon={<Phone className="h-4 w-4" />}
                          helperText="Used for SMS day-of-show coordinates."
                        />

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1">
                            Date of Birth <span className="text-[#D4AF37]">*</span>
                          </label>
                          <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full h-11 rounded-md bg-[#111115] text-[#F8F8FC] text-sm border border-[#2A2A38] focus:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37] px-3.5"
                          />
                          {fieldErrors.dateOfBirth && (
                            <p className="text-xs text-[#EF4444]" role="alert">
                              {fieldErrors.dateOfBirth}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2 Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#1E1E28]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(1)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to VIP Tier
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Address
                    </Button>
                  </div>
                </form>
              )}

              {/* ============================================================= */}
              {/* STEP 3: RESIDENTIAL & SHIPPING ADDRESS (USA DROPDOWNS)        */}
              {/* ============================================================= */}
              {currentStep === 3 && (
                <form onSubmit={handleProceedFromStep3} className="space-y-6 animate-fadeIn">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 3 of 5
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Residential & Shipping Address
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Your commemorative embossed physical Fan Card will be shipped to this verified US mailing address.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {/* Street Address */}
                      <Input
                        label="Street Address Line 1"
                        placeholder="123 Peachtree St NE"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        error={fieldErrors.addressLine1}
                        required
                        leftIcon={<Home className="h-4 w-4" />}
                      />

                      <Input
                        label="Apartment, Suite, or Unit (Optional)"
                        placeholder="Apt 4B or Suite 200"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                      />

                      {/* Complete USA State & Cities Dropdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Complete USA State Dropdown */}
                        <Select
                          label="USA State"
                          required
                          placeholder="Select US State..."
                          options={usStateOptions}
                          value={selectedState}
                          onChange={(e) => {
                            setSelectedState(e.target.value);
                            setSelectedCityName("");
                            setCustomCityName("");
                          }}
                          error={fieldErrors.state}
                          helperText="All 50 states, DC, and PR included."
                        />

                        {/* 2. Complete USA Dependent Cities Dropdown */}
                        <div className="space-y-1.5">
                          <Select
                            label="USA City"
                            required
                            disabled={!selectedState}
                            placeholder={
                              selectedState
                                ? "Select your city..."
                                : "Select a state first..."
                            }
                            options={cityOptions}
                            value={selectedCityName}
                            onChange={(e) => setSelectedCityName(e.target.value)}
                            error={fieldErrors.city}
                            helperText={
                              selectedState
                                ? `${citiesForSelectedState.length} cities available for ${selectedState}`
                                : "State selection filters city options"
                            }
                          />

                          {/* Fallback Custom City Input if 'OTHER_CUSTOM' chosen */}
                          {selectedCityName === "OTHER_CUSTOM" && (
                            <div className="pt-2 animate-fadeIn">
                              <Input
                                label="Custom City / Township Name"
                                placeholder="Enter your city name..."
                                value={customCityName}
                                onChange={(e) => setCustomCityName(e.target.value)}
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ZIP Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="ZIP / Postal Code"
                          placeholder="30303"
                          value={postalCode}
                          maxLength={10}
                          onChange={(e) => setPostalCode(e.target.value)}
                          error={fieldErrors.postalCode}
                          required
                          helperText="5-digit United States postal code."
                        />

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF]">
                            Country
                          </label>
                          <input
                            type="text"
                            value="United States (USA)"
                            readOnly
                            disabled
                            className="w-full h-11 rounded-md bg-[#09090B] text-[#9E9EAF] text-sm border border-[#2A2A38] px-3.5 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 3 Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#1E1E28]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(2)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to Personal Info
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Valid ID Upload
                    </Button>
                  </div>
                </form>
              )}

              {/* ============================================================= */}
              {/* STEP 4: GOVERNMENT PHOTO ID UPLOAD                            */}
              {/* ============================================================= */}
              {currentStep === 4 && (
                <form onSubmit={handleProceedFromStep4} className="space-y-6 animate-fadeIn">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 4 of 5
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Upload Valid Government Photo ID
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Upload a legible image or scan of your government-issued photo identification. Required for VIP gate security matching.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <IdUpload
                        idType={idType}
                        onIdTypeChange={(val) => setIdType(val)}
                        idFile={uploadedIdFile}
                        onIdFileChange={(file) => setUploadedIdFile(file)}
                        idNumber={idNumber}
                        onIdNumberChange={(val) => setIdNumber(val)}
                        error={fieldErrors.idFile || fieldErrors.idType}
                        required
                      />

                      {/* Optional Notes */}
                      <div className="mt-6 pt-6 border-t border-[#1E1E28]">
                        <Textarea
                          label="Special Accommodations or Accessibility Requests (Optional)"
                          placeholder="Wheelchair access, hearing assistance, or special coordination with the tour team..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Honeypot field for anti-bot protection */}
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

                  {/* Step 4 Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#1E1E28]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(3)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to Address
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Review & VIP Agreement
                    </Button>
                  </div>
                </form>
              )}

              {/* ============================================================= */}
              {/* STEP 5: REVIEW, CONSENTS & FINAL SUBMISSION                   */}
              {/* ============================================================= */}
              {currentStep === 5 && (
                <form onSubmit={handleSubmitRegistration} className="space-y-6 animate-fadeIn">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                      Step 5 of 5
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase mt-1">
                      Review & Confirm VIP Registration
                    </h1>
                    <p className="text-sm text-[#9E9EAF] mt-1">
                      Review your membership information and accept the VIP terms before submitting.
                    </p>
                  </div>

                  <Card className="divide-y divide-[#1E1E28]">
                    {/* 1. VIP Membership Tier & Scope */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111115]">
                      <div>
                        <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
                          VIP Membership Pass
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {MEMBERSHIP_TIERS.find((t) => t.id === membershipTier)?.name}
                        </h4>
                        <p className="text-xs text-[#9E9EAF]">
                          {selectedTourCity ? (
                            <>
                              {selectedTourCity.name}, {selectedTourCity.state} &bull;{" "}
                              {selectedTourCity.venue_name || "Official Venue"} (
                              {new Date(`${selectedTourCity.tour_date}T12:00:00`).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              )
                            </>
                          ) : (
                            "Nationwide VIP All-Access &bull; Valid across all tour dates & appearances"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" size="md">
                          {MEMBERSHIP_TIERS.find((t) => t.id === membershipTier)?.price}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(1)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* 2. Personal & Contact Details */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B6B7E] uppercase tracking-wider">
                          Attendee Details
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-0.5">
                          {normalizeName(firstName)} {normalizeName(lastName)}
                        </h4>
                        <p className="text-xs text-[#9E9EAF]">
                          {email} &bull; {normalizePhoneNumber(phone)} &bull; DOB: {dateOfBirth}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(2)}
                      >
                        Edit
                      </Button>
                    </div>

                    {/* 3. Address Details */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B6B7E] uppercase tracking-wider">
                          Fan Card Shipping Destination
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-0.5">
                          {addressLine1} {addressLine2 ? `, ${addressLine2}` : ""}
                        </h4>
                        <p className="text-xs text-[#9E9EAF]">
                          {effectiveCity}, {selectedState} {postalCode}, USA
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(3)}
                      >
                        Edit
                      </Button>
                    </div>

                    {/* 4. Valid ID Document Summary */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#181820] border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider font-semibold">
                            Government Photo ID Attached
                          </span>
                          <h4 className="text-sm font-semibold text-white mt-0.5 truncate max-w-xs sm:max-w-md">
                            {uploadedIdFile?.name}
                          </h4>
                          <p className="text-xs text-[#6B6B7E]">
                            {idType} {idNumber ? `&bull; #${idNumber}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(4)}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>

                  {/* Required Legal Checkboxes */}
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={certifyIdentity}
                          onChange={(e) => setCertifyIdentity(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-[#2A2A38] bg-[#111115] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                        />
                        <span className="text-xs text-[#9E9EAF] leading-relaxed">
                          I certify that my legal name, date of birth, residential address, and uploaded government photo identification are true, valid, and belong to me.
                        </span>
                      </label>
                      {fieldErrors.certifyIdentity && (
                        <p className="text-xs text-[#EF4444]" role="alert">
                          {fieldErrors.certifyIdentity}
                        </p>
                      )}

                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-[#2A2A38] bg-[#111115] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                        />
                        <span className="text-xs text-[#9E9EAF] leading-relaxed">
                          I understand that Meet & Greet scheduling cohorts are confidential and non-transferable, and I agree to present matching photo ID at venue security check-in.
                        </span>
                      </label>
                      {fieldErrors.agreeTerms && (
                        <p className="text-xs text-[#EF4444]" role="alert">
                          {fieldErrors.agreeTerms}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Step 5 Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#1E1E28]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(4)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to ID Upload
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      leftIcon={<Send className="h-4 w-4" />}
                      className="shadow-xl"
                    >
                      Complete VIP Registration
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Container>
      </main>

      <PublicFooter />
    </div>
  );
};
