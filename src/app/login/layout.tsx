import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Daisy Weekly account to check your matches and manage your profile.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
