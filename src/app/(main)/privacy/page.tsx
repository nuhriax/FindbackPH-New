import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FindBack PH",
  description:
    "How FindBack PH collects, uses, and protects your personal information while keeping your community safe.",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <span className="section-eyebrow">Legal &amp; transparency</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: August 2025
        </p>

        <div className="prose mt-8 space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              What we collect
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              When you create an account, we collect your name, email address, and a
              username. When you post a report, we collect the details you choose to
              share about the item (title, category, description, location, and any
              photos you upload). When you message another user, we store the messages
              so you can reference the conversation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              Why we collect it
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              We collect this information to keep you signed in, to allow you to report
              and find items, and to let you communicate with the people connected to a
              report. Your messages and profile are used solely to make the service
              work.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              What we do not share
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              We never publicly show your email address or phone number. Your profile is
              shown only by your chosen username. We do not sell your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              How reports work
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Reports you post (such as item title, description, and location) are
              visible to other users so they can help identify matches. Do not include
              sensitive personal information in a public report.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              How messaging works
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Private messages are only visible to you and the other participant in the
              conversation. Other users cannot read them. We do not expose your contact
              details through messaging.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              Data storage & security
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Your data is stored securely in a protected database. Access to your
              account is protected by your password. We encourage you to use a strong,
              unique password.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              Photos & sensitive information
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              When uploading photos of an item, avoid including sensitive documents such
              as IDs, passports, bank cards, or addresses. We will remove obviously
              sensitive images if reported.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              Your choices
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              You can edit or delete your reports from your dashboard at any time. You
              can also stop receiving notification emails by adjusting your preferences.
              If you would like to request deletion of your account data, contact us and
              we will assist you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              Changes to this policy
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              We may update this policy as our service evolves. Continued use after
              changes indicates acceptance. Read our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              for more about how FindBack PH works.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
