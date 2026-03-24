"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { ONBOARDING_STEPS } from "@/lib/constants";
import type {
  OnboardingData,
  UserProfile,
  UserPreferences,
  ContactPreference,
} from "@/lib/types";
import StepWelcome from "@/components/onboarding/StepWelcome";
import StepAccount from "@/components/onboarding/StepAccount";
import StepProfile from "@/components/onboarding/StepProfile";
import StepIdentity from "@/components/onboarding/StepIdentity";
import StepPreferences from "@/components/onboarding/StepPreferences";
import StepContact from "@/components/onboarding/StepContact";
import StepReview from "@/components/onboarding/StepReview";
import StepSuccess from "@/components/onboarding/StepSuccess";

const INITIAL_DATA: OnboardingData = {
  email: "",
  password: "",
  profile: {
    firstName: "",
    school: "",
    major: "",
    age: null,
    gender: "",
  },
  preferences: {
    genderPreference: "",
    schoolPreference: "any",
    ageRange: { min: 18, max: 25 },
    majorPreference: "",
  },
  contact: {
    method: "instagram",
    value: "",
  },
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [signupError, setSignupError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goForward = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, 8));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const updateEmail = useCallback((email: string) => {
    setData((prev) => ({ ...prev, email }));
  }, []);

  const updatePassword = useCallback((password: string) => {
    setData((prev) => ({ ...prev, password }));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  const updateContact = useCallback((updates: Partial<ContactPreference>) => {
    setData((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...updates },
    }));
  }, []);

  const handleSignup = useCallback(async () => {
    setSignupError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.profile.firstName,
          school: data.profile.school,
          major: data.profile.major,
          age: String(data.profile.age ?? ""),
          gender: data.profile.gender,
          ethnicity: data.profile.ethnicity ?? "",
          genderPreference: data.preferences.genderPreference,
          schoolPreference: data.preferences.schoolPreference,
          ageRangeMin: String(data.preferences.ageRange.min),
          ageRangeMax: String(data.preferences.ageRange.max),
          majorPreference: data.preferences.majorPreference,
          ethnicityPreference: data.preferences.ethnicityPreference ?? "",
          contactMethod: data.contact.method,
          contactValue: data.contact.value,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Signup failed. Please try again.");
      }

      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error(
          "Account created but sign-in failed. Please try logging in."
        );
      }

      setCurrentStep(8);
    } catch (err) {
      setSignupError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [data]);

  const steps = ONBOARDING_STEPS.map(({ label, description }) => ({
    label,
    description,
  }));

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <StepWelcome onNext={goForward} />;
      case 2:
        return (
          <StepAccount
            email={data.email}
            password={data.password}
            onEmailChange={updateEmail}
            onPasswordChange={updatePassword}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 3:
        return (
          <StepProfile
            profile={data.profile}
            onProfileChange={updateProfile}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 4:
        return (
          <StepIdentity
            ethnicity={data.profile.ethnicity}
            onEthnicityChange={(ethnicity) => updateProfile({ ethnicity })}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 5:
        return (
          <StepPreferences
            preferences={data.preferences}
            onPreferencesChange={updatePreferences}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 6:
        return (
          <StepContact
            contact={data.contact}
            email={data.email}
            onContactChange={updateContact}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 7:
        return (
          <StepReview
            data={data}
            onNext={handleSignup}
            onBack={goBack}
            goToStep={goToStep}
            loading={isSubmitting}
            error={signupError}
          />
        );
      case 8:
        return <StepSuccess />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="min-h-dvh bg-ivory">
        <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
          <DaisyLogo size="sm" />
          {currentStep < 8 && (
            <Button variant="ghost" size="sm" href="/">
              Save &amp; exit
            </Button>
          )}
        </header>

        {currentStep < 8 && (
          <div className="px-5 pb-6 md:px-8 md:pb-8">
            <ProgressStepper
              currentStep={currentStep}
              totalSteps={7}
              steps={steps}
            />
          </div>
        )}

        <main className="flex justify-center px-5 pb-12 md:px-8">
          <div
            key={currentStep}
            className="w-full max-w-lg"
            style={{ animation: "onboarding-enter 0.35s ease-out" }}
          >
            {renderStep()}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes onboarding-enter {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes onboarding-enter {
            from { opacity: 1; transform: none; }
            to   { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </>
  );
}
