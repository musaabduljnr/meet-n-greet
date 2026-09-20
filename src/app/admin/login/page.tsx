"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { loginAdminAction } from "@/app/actions/auth";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnUrl = searchParams.get("returnUrl") || "/admin";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "session_expired"
      ? "Your administrative session has expired. Please sign in again."
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("returnUrl", returnUrl);

    startTransition(async () => {
      try {
        const result = await loginAdminAction(formData);

        if (!result.success) {
          setErrorMessage(result.error || "Authentication failed.");
          return;
        }

        router.push(result.redirectUrl || "/admin");
        router.refresh();
      } catch {
        setErrorMessage("An unexpected server error occurred. Please try again.");
      }
    });
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("WayneVIP2026!");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#09090B] px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181820] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restricted Access</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F8FC] uppercase">
            Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-[#9E9EAF] mt-1.5">
            Kountry Wayne VIP Meet & Greet Tour Administration
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-[#2A2A38] bg-[#111115]/95 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-6">
                <Alert variant="error" title="Sign In Error">
                  {errorMessage}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Staff Email Address"
                type="email"
                placeholder="name@kountrywayne.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-8 text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isPending}
                >
                  Sign In to Console
                </Button>
              </div>
            </form>

            {/* Quick-Fill Demo Profiles for Development Testing (Hidden in production) */}
            {(process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_ADMINS === "true") && (
              <div className="mt-6 pt-5 border-t border-[#1E1E28]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B6B7E] block mb-2 text-center">
                  Development Test Profiles:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("superadmin@kountrywayne.com")}
                    className="px-2 py-1.5 rounded bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-[11px] font-medium text-[#C8C8DC] text-center transition-colors"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("admin@kountrywayne.com")}
                    className="px-2 py-1.5 rounded bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-[11px] font-medium text-[#C8C8DC] text-center transition-colors"
                  >
                    Tour Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("staff@kountrywayne.com")}
                    className="px-2 py-1.5 rounded bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-[11px] font-medium text-[#C8C8DC] text-center transition-colors"
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#9E9EAF] hover:text-[#F8F8FC] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Return to Public Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-[#9E9EAF]">
          Loading sign in...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
