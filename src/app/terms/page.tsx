import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for Daisy Weekly, the weekly student matchmaking service for Montreal campuses.",
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

export default function TermsPage() {
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
                Terms of Service
              </h1>
              <p className="mt-3 text-sm text-text-tertiary">
                Last updated: March 2026
              </p>
            </header>

            <div className="pb-8">
              <Section title="Acceptance of terms">
                <p>
                  By creating an account or using Daisy (“the Service”), you
                  agree to these Terms of Service and our Privacy Policy. If
                  you don’t agree, please don’t use Daisy. We may update these
                  terms from time to time; we’ll note the “last updated” date at
                  the top of this page. Continuing to use Daisy after changes
                  means you accept the updated terms.
                </p>
              </Section>

              <Section title="Eligibility">
                <p>
                  Daisy is only available to people aged 18 or older. It is
                  intended for students who are currently enrolled at a
                  university, college or CEGEP. When you sign up you confirm
                  both of these things, and that the school and enrollment
                  information on your profile is accurate.
                </p>
                <p className="mt-3">
                  We rely on what you tell us. Daisy does not ask for
                  identification, student cards, or proof of enrollment, and we
                  do not independently verify your age or student status. If we
                  learn that an account does not meet these requirements, we may
                  suspend or close it.
                </p>
              </Section>

              <Section title="Account responsibilities">
                <p>
                  Keep your login secure and your profile information truthful.
                  One person, one account—don’t create duplicate or fake
                  profiles or impersonate someone else. You’re responsible for
                  activity that happens under your account until you tell us it
                  was compromised and we’ve had a reasonable chance to help.
                </p>
              </Section>

              <Section title="Acceptable use">
                <p>
                  Daisy works when everyone treats others with respect. Don’t
                  harass, threaten, or discriminate against other users. Don’t
                  scrape, spam, or misuse the platform for commercial
                  solicitation without our permission. Fake profiles, catfishing,
                  and attempts to manipulate the matching system undermine trust
                  for everyone—we may remove content or accounts that violate
                  these expectations.
                </p>
              </Section>

              <Section title="Matching service">
                <p>
                  Daisy suggests introductions based on the information you and
                  others provide. Matching is a best-effort process: we don’t
                  guarantee that you’ll receive matches, that matches will
                  respond, or that any connection will lead to a relationship.
                  We’re here to facilitate introductions, not to mediate
                  disputes between users after you connect.
                </p>
              </Section>

              <Section title="Payments and refunds">
                <p>
                  Daisy’s core service is free. Creating an account, receiving
                  your weekly match, and connecting when there is mutual
                  interest cost nothing.
                </p>
                <p className="mt-3">
                  Daisy may offer optional paid features. Currently there is
                  one: a reroll, which costs $1.99 CAD as a one-time purchase
                  and provides one replacement match for the current matching
                  period. A reroll is not a subscription. It does not renew, and
                  buying one does not enrol you in any recurring charge. The
                  price is shown before you pay, and payments are processed by
                  Stripe.
                </p>
                <p className="mt-3">
                  Because a reroll is delivered immediately once a replacement
                  match is generated, reroll purchases are generally final once
                  fulfilled. We may issue refunds for duplicate charges, for
                  technical failures where the reroll you paid for was not
                  delivered, or where a refund is otherwise required by
                  applicable law. For billing questions or to request a refund,
                  email{" "}
                  <a
                    href="mailto:malik.shourbaji@gmail.com"
                    className="font-medium text-sage underline-offset-4 hover:underline"
                  >
                    malik.shourbaji@gmail.com
                  </a>
                  .
                </p>
              </Section>

              <Section title="Intellectual property">
                <p>
                  The Daisy name, logo, visual design, and other materials we
                  provide through the Service are owned by us or our licensors.
                  You may not copy, modify, or use them for your own products or
                  marketing without written permission. You keep ownership of
                  content you submit (like your profile text), but you give us a
                  license to host, display, and process it as needed to run the
                  Service.
                </p>
              </Section>

              <Section title="Limitation of liability">
                <p>
                  To the fullest extent permitted by law, Daisy and its team are
                  not liable for indirect, incidental, or consequential damages
                  arising from your use of the Service—including lost
                  relationships, emotional distress, or lost data—except where
                  the law doesn’t allow that limitation. Our total liability for
                  claims related to the Service is limited to the greater of
                  what you paid us in the past twelve months (if anything) or
                  fifty dollars (USD), unless a mandatory law says otherwise.
                </p>
              </Section>

              <Section title="Changes to terms">
                <p>
                  We may modify these terms or the Service to improve safety,
                  comply with law, or reflect how Daisy evolves. When we make
                  material changes, we’ll try to give you reasonable notice (for
                  example, by email or an in-app message). If you keep using
                  Daisy after the effective date, the new terms apply.
                </p>
              </Section>

              <Section title="Contact" className="mb-0">
                <p>
                  For questions about these terms, reach us at{" "}
                  <a
                    href="mailto:malik.shourbaji@gmail.com"
                    className="font-medium text-sage underline-offset-4 hover:underline"
                  >
                    malik.shourbaji@gmail.com
                  </a>
                  .
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
