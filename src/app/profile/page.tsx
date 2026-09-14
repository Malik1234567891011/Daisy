"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Panel, PanelTitle, Muted, Pill, Field, ToggleChips, FormStatus, ActionRow,
} from "@/components/dashboard/primitives";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SCHOOLS, MAJORS, ETHNICITIES, GENDERS, IDEAL_HANGOUTS } from "@/lib/constants";
import { parseIdealHangouts, stringifyIdealHangouts } from "@/lib/idealHangouts";
import ProfilePhotoPicker from "@/components/profile/ProfilePhotoPicker";
import { Mail, Settings } from "lucide-react";

const SCHOOL_OPTIONS = SCHOOLS.map((s) => ({ value: s, label: s }));
const MAJOR_OPTIONS = MAJORS.map((m) => ({ value: m, label: m }));
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g, label: g }));
const ETHNICITY_OPTIONS = ETHNICITIES.map((e) => ({ value: e, label: e }));
const HANGOUT_OPTIONS = IDEAL_HANGOUTS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}` }));

function ethnicityApiToSelected(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(", ")
    .map((s) => s.trim())
    .filter((s) => ETHNICITIES.includes(s));
}

function hangoutsApiToSelected(raw: string | null | undefined): string[] {
  const known = IDEAL_HANGOUTS.map((o) => o.value);
  return parseIdealHangouts(raw).filter((v) => known.includes(v));
}

interface FormErrors {
  firstName?: string;
  school?: string;
  major?: string;
  age?: string;
  idealHangouts?: string;
}

/**
 * Who you are: photo, the basics, and what a first hangout looks like.
 * How a match reaches you lives on its own page (/profile/contact), and what
 * you're looking for on /preferences — three links on the dashboard, three
 * places to land.
 */
export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedHangouts, setSelectedHangouts] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function loadUser() {
      setLoadError(null);
      setIsFetchingUser(true);
      try {
        const res = await fetch("/api/user");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load profile");
        }
        if (cancelled) return;
        setFirstName(typeof data.firstName === "string" ? data.firstName : "");
        setSchool(typeof data.school === "string" ? data.school : "");
        setMajor(typeof data.major === "string" ? data.major : "");
        setAge(data.age != null && data.age !== "" ? String(data.age) : "");
        setGender(typeof data.gender === "string" ? data.gender : "");
        setSelectedEthnicities(ethnicityApiToSelected(data.ethnicity));
        setSelectedHangouts(hangoutsApiToSelected(data.idealHangout));
        setPhotoUrl(typeof data.photoUrl === "string" ? data.photoUrl : null);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!cancelled) setIsFetchingUser(false);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, [status]);

  const isPageLoading = status === "loading" || (status === "authenticated" && isFetchingUser);

  const toggleEthnicity = useCallback((eth: string) => {
    setSelectedEthnicities((prev) => (prev.includes(eth) ? prev.filter((e) => e !== eth) : [...prev, eth]));
  }, []);
  const toggleHangout = useCallback((v: string) => {
    setSelectedHangouts((prev) => (prev.includes(v) ? prev.filter((h) => h !== v) : [...prev, v]));
  }, []);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!school) next.school = "Please select your school";
    if (!major) next.major = "Please select your major";
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum)) next.age = "Please enter your age";
    else if (ageNum < 18 || ageNum > 30) next.age = "Age must be between 18 and 30";
    if (selectedHangouts.length === 0) next.idealHangouts = "Pick at least one";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [firstName, school, major, age, selectedHangouts]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          school,
          major,
          age,
          gender,
          ethnicity: selectedEthnicities.length > 0 ? selectedEthnicities.join(", ") : "",
          idealHangout: stringifyIdealHangouts(selectedHangouts),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save profile");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }, [validate, firstName, school, major, age, gender, selectedEthnicities, selectedHangouts]);

  if (status === "unauthenticated") return null;

  return (
    <DashboardShell title="Your profile" backHref="/dashboard">
      <Muted className="-mt-2 text-center">This is what helps us find your match. Update anytime.</Muted>

      {isPageLoading && <FormStatus kind="info">Loading profile…</FormStatus>}
      {loadError && !isPageLoading && <FormStatus kind="error">{loadError}</FormStatus>}
      {saved && <FormStatus kind="success">Profile updated.</FormStatus>}
      {saveError && <FormStatus kind="error">{saveError}</FormStatus>}

      <Panel id="photo">
        <ProfilePhotoPicker photoUrl={photoUrl} onUploaded={setPhotoUrl} disabled={isPageLoading} />
      </Panel>

      <Panel className="flex flex-col gap-6">
        <PanelTitle className="text-[20px]">The basics</PanelTitle>

        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={errors.firstName}
          placeholder="Your first name"
          disabled={isPageLoading}
        />
        <Select
          label="School"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          options={SCHOOL_OPTIONS}
          placeholder="Select your school"
          error={errors.school}
          disabled={isPageLoading}
        />
        <Select
          label="Major"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          options={MAJOR_OPTIONS}
          placeholder="Select your major"
          error={errors.major}
          disabled={isPageLoading}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            min={18}
            max={30}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            error={errors.age}
            placeholder="18"
            disabled={isPageLoading}
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select"
            disabled={isPageLoading}
          />
        </div>

        <Field
          label="Ethnicity"
          optional
          hint="Only used to respect preferences, if you choose to include it."
        >
          <ToggleChips
            label="Ethnicity options"
            options={ETHNICITY_OPTIONS}
            selected={selectedEthnicities}
            onToggle={toggleEthnicity}
            disabled={isPageLoading}
          />
        </Field>

        <Field
          label="Ideal first hangout"
          hint="What you’d actually want to do on a first date. Pick any."
          error={errors.idealHangouts}
        >
          <ToggleChips
            label="Ideal first hangout options"
            options={HANGOUT_OPTIONS}
            selected={selectedHangouts}
            onToggle={toggleHangout}
            disabled={isPageLoading}
          />
        </Field>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <Pill onClick={handleSave} disabled={isPageLoading || isSaving} className="w-full">
          {isSaving ? "Saving…" : "Save changes"}
        </Pill>
        <Pill tone="glass" href="/dashboard" className="w-full">
          Cancel
        </Pill>
      </div>

      <Panel>
        <PanelTitle className="text-[20px]">Also yours</PanelTitle>
        <div className="mt-4 flex flex-col gap-2.5">
          <ActionRow href="/profile/contact" icon={Mail} title="Contact info" subtitle="How your match reaches you" />
          <ActionRow href="/preferences" icon={Settings} tone="bloom" title="Preferences" subtitle="Who you want to meet" />
        </div>
      </Panel>
    </DashboardShell>
  );
}
