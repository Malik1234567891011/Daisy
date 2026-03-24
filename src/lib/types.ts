export interface UserProfile {
  firstName: string;
  school: string;
  major: string;
  age: number | null;
  gender: string;
  ethnicity?: string;
}

export interface UserPreferences {
  genderPreference: string;
  schoolPreference: "same" | "nearby" | "any";
  ageRange: { min: number; max: number };
  majorPreference: string;
  ethnicityPreference?: string;
}

export type ContactMethod = "instagram" | "phone" | "email";

export interface ContactPreference {
  method: ContactMethod;
  value: string;
}

export interface OnboardingData {
  email: string;
  password: string;
  profile: UserProfile;
  preferences: UserPreferences;
  contact: ContactPreference;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Step {
  id: number;
  label: string;
  description: string;
}
