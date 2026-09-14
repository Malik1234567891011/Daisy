"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import StepPhone from "@/components/onboarding/StepPhone";
import StepOTP from "@/components/onboarding/StepOTP";

export default function VerifyPhonePage() {
  const { status } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(true);
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const handleCodeSent = useCallback(() => setStep("otp"), []);
  const handleBackToPhone = useCallback(() => setStep("phone"), []);

  const handleVerified = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-dvh flex-col bg-ivory bg-grain">
      <Navbar />
      <main className="flex-1 section-container py-12 sm:py-16">
        <div className="max-w-md mx-auto">
          {step === "phone" ? (
            <StepPhone
              phone={phone}
              onPhoneChange={setPhone}
              smsConsent={smsConsent}
              onSmsConsentChange={setSmsConsent}
              onCodeSent={handleCodeSent}
              onBack={() => router.back()}
            />
          ) : (
            <StepOTP
              phone={phone}
              smsConsent={smsConsent}
              onVerified={handleVerified}
              onBack={handleBackToPhone}
            />
          )}
        </div>
      </main>
    </div>
  );
}
