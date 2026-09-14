import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Daisy Weekly protects your data. We collect only what's needed for matching and never sell your information.",
};

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-8", className)}>
      <h2 className="font-body text-lg font-semibold text-text-primary mb-3">
        {title}
      </h2>
      <div className="space-y-3 text-text-secondary leading-relaxed font-body">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-ivory font-body">
        <div className="section-container py-10 md:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8">
              <Button href="/" variant="ghost" size="sm" className="-ml-2">
                ← Back to home
              </Button>
            </div>

            <header className="mb-10 border-b border-border-light pb-8">
              <h1 className="font-display text-3xl text-charcoal tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-3 text-sm text-text-tertiary">
                Last updated: March 2026
              </p>
            </header>

            <div className="pb-8">
              <Section title="Introduction">
                <p>
                  At Daisy, your privacy is fundamental to everything we build.
                  This policy explains what information we collect when you use
                  our student matchmaking service, how we use it, and the
                  choices you have. We wrote it in plain language so you know
                  exactly what to expect—no hidden surprises.
                </p>
              </Section>

              <Section title="What we collect">
                <p>When you sign up and use Daisy, we may collect:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-text-tertiary">
                  <li>Your name</li>
                  <li>Your school email address, used to sign in</li>
                  <li>Your school and major</li>
                  <li>Your age, and your confirmation that you are 18 or older</li>
                  <li>
                    Your confirmation that you are currently enrolled at a
                    university, college or CEGEP
                  </li>
                  <li>
                    Your mobile number, which we verify by text so we can send
                    you your weekly match
                  </li>
                  <li>Your profile photo, if you add one</li>
                  <li>
                    Optionally, ethnicity—only if you choose to share it to help
                    us support inclusive matching
                  </li>
                  <li>
                    Your contact preference (for example, how you’d like to be
                    reached when there’s a mutual match)
                  </li>
                </ul>
                <p>
                  We only ask for what we need to run the service safely and
                  fairly. You can review and update most of this in your
                  account settings.
                </p>
              </Section>

              <Section title="How we use your information">
                <p>
                  We use your information to operate Daisy: building your
                  profile, confirming your mobile number, and suggesting
                  compatible matches. We rely on what you tell us about your
                  age and enrollment—we don’t ask for documents and we don’t
                  independently verify either. Your data is used for matching and
                  platform safety—not for selling to data brokers, and not to
                  show you third-party ads. We don’t use what you share on Daisy
                  to train unrelated advertising models.
                </p>
              </Section>

              <Section title="What we share">
                <p>
                  We only share your contact details with another user when you
                  both indicate a mutual interest in connecting. Outside of
                  that, we don’t sell your personal information, and we don’t
                  post your profile on public search engines. We may share
                  limited information with service providers who help us run
                  the app, under contracts that require them to protect your
                  data and use it only for those services—currently our hosting
                  and database providers, Twilio for text messages, and Stripe
                  if you buy a reroll. Payment card details go directly to
                  Stripe; Daisy never sees or stores them.
                </p>
              </Section>

              <Section title="Data security">
                <p>
                  We protect your information with industry-standard encryption
                  in transit and sensible safeguards on our systems. Access
                  inside our team is limited to people who need it to keep Daisy
                  running and safe. No method of transmission over the internet
                  is 100% secure, but we work continuously to reduce risk and
                  respond quickly if something goes wrong.
                </p>
              </Section>

              <Section title="Your rights">
                <p>
                  You can request access to the personal data we hold about you,
                  ask us to correct mistakes, or ask us to delete your account
                  and associated data, subject to any legal obligations we must
                  keep (for example, short-term fraud-prevention logs). If
                  you’re in a region with specific privacy laws, you may have
                  additional rights—we’ll honor those where they apply.
                </p>
              </Section>

              <Section title="Contact us" className="mb-0">
                <p>
                  Questions about this policy or your data? Email us at{" "}
                  <a
                    href="mailto:malik.shourbaji@gmail.com"
                    className="font-medium text-sage underline-offset-4 hover:underline"
                  >
                    malik.shourbaji@gmail.com
                  </a>
                  . We’re happy to help.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
