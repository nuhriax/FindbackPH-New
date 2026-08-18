import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <span className="section-eyebrow">Legal &amp; transparency</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: August 2025
        </p>

        <div className="prose mt-8 space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              1. What FindBack PH is
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              FindBack PH is a community-powered platform that helps people in the
              Philippines reconnect lost and found items. Users can post reports about
              items they have lost or found, search existing reports, and message each
              other privately through the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              2. Your responsibilities
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              When you use FindBack PH, you agree to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-700">
              <li>Provide accurate information in your reports.</li>
              <li>Not post fake, misleading, or harmful reports.</li>
              <li>Respect other users and not harass or threaten anyone.</li>
              <li>Not attempt to scam other users or misrepresent yourself.</li>
              <li>Arrange safe, public, in-person meetups when exchanging items.</li>
              <li>Follow all applicable Philippine laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              3. What you should not share
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Never share passwords, OTPs (one-time passwords), banking information,
              full home addresses, or other sensitive personal information through the
              platform or during a meetup. Keep communication within FindBack PH and
              use the private messaging system.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              4. Content you post
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              You retain ownership of the content you post. By posting a report, you
              grant FindBack PH a non-exclusive license to display it on the platform so
              other users can view and search it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              5. Account & conduct
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              You are responsible for keeping your account credentials secure. If you
              abuse the platform — for example, by posting fake reports or harassing
              other users — we may suspend or remove your account. We may also remove
              individual reports that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              6. Reporting issues
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              If you see content that seems like a scam, a fake report, harassment, or
              otherwise inappropriate, please use the &quot;Report&quot; option on the item page.
              Our moderators will review it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              7. Limitation of liability
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              FindBack PH is a platform that connects users. We are not a party to any
              agreement between users and we do not guarantee that any item will be
              recovered or returned. Arranging meetups, verifying ownership, and
              exchanging items is entirely between the users involved. You use the
              platform at your own risk.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              8. Changes to these terms
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              We may update these terms from time to time. When we make significant
              changes, we will update the date on this page. Continued use of the
              platform after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy-900">
              9. Contact
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              If you have questions about these terms, please reach out through our
              help page. You can also read our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
