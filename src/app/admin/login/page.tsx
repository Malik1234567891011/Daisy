"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, AuthPanel, AuthSubmit } from "@/components/auth/AuthPanel";

/**
 * One field: the admin key. Same card as the student sign-in so the door to
 * the back office looks like it belongs to the same house.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!key.trim()) {
      setError("Enter the admin key");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "That key is not right");
        setSubmitting(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Daisy Admin" backHref="/" backLabel="Back to home">
      <AuthPanel>
        <form onSubmit={handleSubmit} noValidate>
          <AuthField
            label="Admin key"
            type="password"
            name="key"
            autoComplete="current-password"
            autoFocus
            placeholder="paste the admin key"
            value={key}
            error={error}
            disabled={submitting}
            onChange={(e) => {
              setKey(e.target.value);
              if (error) setError("");
            }}
          />
          <div className="mt-7">
            <AuthSubmit type="submit" disabled={submitting}>
              {submitting ? "Opening…" : "Open dashboard"}
            </AuthSubmit>
          </div>
        </form>
      </AuthPanel>
    </AuthShell>
  );
}
