"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { ONBOARDING_STEPS } from "@/lib/constants";
import type {
  OnboardingData,
  UserProfile,
  UserPreferences,
  PersonalityData,
  ContactPreference,
} from "@/lib/types";
import StepWelcome from "@/components/onboarding/StepWelcome";
import StepAccount from "@/components/onboarding/StepAccount";
import StepProfile from "@/components/onboarding/StepProfile";
import StepIdentity from "@/components/onboarding/StepIdentity";
import StepPersonality from "@/components/onboarding/StepPersonality";
import StepInterests from "@/components/onboarding/StepInterests";
import StepPreferences from "@/components/onboarding/StepPreferences";
import StepContact from "@/components/onboarding/StepContact";
import StepReview from "@/components/onboarding/StepReview";
import StepPhoto from "@/components/onboarding/StepPhoto";
import StepPhone from "@/components/onboarding/StepPhone";
import StepOTP from "@/components/onboarding/StepOTP";
import StepSuccess from "@/components/onboarding/StepSuccess";

const TOTAL_PROGRESS_STEPS = 12;
const CINEMATIC_STEP = 13;

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
  personality: {
    intentions: "",
    vibe: "",
    interests: [],
    idealHangout: "",
    availability: [],
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
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(() => {
    const ref = searchParams.get("ref") ?? undefined;
    // The landing hero collects an email before sending people here, so the
    // first step arrives already filled in.
    const email = searchParams.get("email")?.trim() ?? "";
    return { ...INITIAL_DATA, referralSource: ref, email };
  });
  const [phone, setPhone] = useState("");
  const [signupError, setSignupError] = useState("");
  // Deliberately not persisted with the rest of the draft: an attestation has
  // to be an act the user performs, not a value restored from storage.
  const [attestations, setAttestations] = useState({ age18: false, student: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capture referral and prefilled email from the URL if they change.
  useEffect(() => {
    const ref = searchParams.get("ref");
    const email = searchParams.get("email")?.trim();
    if (!ref && !email) return;
    setData((prev) => ({
      ...prev,
      ...(ref ? { referralSource: ref } : {}),
      // Never clobber something already typed on the account step.
      ...(email && !prev.email ? { email } : {}),
    }));
  }, [searchParams]);

  const goForward = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, CINEMATIC_STEP));
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

  const updatePersonality = useCallback((updates: Partial<PersonalityData>) => {
    setData((prev) => ({
      ...prev,
      personality: { ...prev.personality, ...updates },
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

  const handleAttestationChange = useCallback(
    (key: "age18" | "student", value: boolean) => {
      setAttestations((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

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
          intentions: data.personality.intentions,
          vibe: data.personality.vibe,
          interests: data.personality.interests,
          idealHangout: data.personality.idealHangout,
          availability: data.personality.availability,
          genderPreference: data.preferences.genderPreference,
          schoolPreference: data.preferences.schoolPreference,
          ageRangeMin: String(data.preferences.ageRange.min),
          ageRangeMax: String(data.preferences.ageRange.max),
          majorPreference: data.preferences.majorPreference,
          ethnicityPreference: data.preferences.ethnicityPreference ?? "",
          contactMethod: data.contact.method,
          contactValue: data.contact.value,
          referralSource: data.referralSource ?? "",
          age18Attested: attestations.age18,
          studentAttested: attestations.student,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Signup failed. Please try again.");
      }

      const signInRes = await signIn("credentials", {
        identifier: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error(
          "Account created but sign-in failed. Please try logging in.",
        );
      }

      setCurrentStep(10);
    } catch (err) {
      setSignupError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [data, attestations.age18, attestations.student]);

  const steps = ONBOARDING_STEPS.map(({ label, description }) => ({
    label,
    description,
  }));

  const showChrome = currentStep < CINEMATIC_STEP;

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
          <StepPersonality
            personality={data.personality}
            onPersonalityChange={updatePersonality}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 6:
        return (
          <StepInterests
            personality={data.personality}
            onPersonalityChange={updatePersonality}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 7:
        return (
          <StepPreferences
            preferences={data.preferences}
            onPreferencesChange={updatePreferences}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 8:
        return (
          <StepContact
            contact={data.contact}
            email={data.email}
            onContactChange={updateContact}
            onNext={goForward}
            onBack={goBack}
          />
        );
      case 9:
        return (
          <StepReview
            data={data}
            attestations={attestations}
            onAttestationChange={handleAttestationChange}
            onNext={handleSignup}
            onBack={goBack}
            goToStep={goToStep}
            loading={isSubmitting}
            error={signupError}
          />
        );
      case 10:
        return (
          <StepPhoto
            onUploaded={goForward}
            onBack={goBack}
          />
        );
      case 11:
        return (
          <StepPhone
            phone={phone}
            onPhoneChange={setPhone}
            onCodeSent={goForward}
            onBack={goBack}
          />
        );
      case 12:
        return (
          <StepOTP
            phone={phone}
            onVerified={() => setCurrentStep(CINEMATIC_STEP)}
            onBack={goBack}
          />
        );
      case CINEMATIC_STEP:
        return <StepSuccess />;
      default:
        return null;
    }
  }

  return (
    <>
      <AuthShell
        title="Sign up"
        width="md"
        backLabel={currentStep === 1 ? "Back to home" : "Back a step"}
        {...(currentStep === 1 ? { backHref: "/" } : { onBack: goBack })}
        footer={
          showChrome ? (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-ivory underline underline-offset-4 transition-opacity hover:opacity-80"
              >
                Sign in
              </Link>
            </>
          ) : null
        }
      >
        {showChrome && (
          <div className="auth-dark mb-6 px-1">
            <ProgressStepper
              currentStep={currentStep}
              totalSteps={TOTAL_PROGRESS_STEPS}
              steps={steps}
            />
          </div>
        )}

        <AuthPanel className="auth-dark">
          <div
            key={currentStep}
            style={{
              animation:
                currentStep < CINEMATIC_STEP
                  ? "onboarding-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                  : "none",
            }}
          >
            {renderStep()}
          </div>
        </AuthPanel>
      </AuthShell>

      <style>{`
        @keyframes onboarding-enter {
          from { opacity: 0; transform: translateY(12px); }
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
