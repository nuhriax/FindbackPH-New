import Link from "next/link";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is FindBack PH?",
    a: "FindBack PH is a community-powered lost & found platform for the Philippines. People who lost something can post a report, and people who found something can post a found report. The platform connects them so items can be returned safely.",
  },
  {
    q: "Is it free to use?",
    a: "Yes, FindBack PH is completely free for everyone. There are no fees for reporting, searching, or messaging.",
  },
  {
    q: "Do I need an account to browse?",
    a: "You can browse lost and found reports without an account. However, you need an account to report an item, save items, or send messages.",
  },
  {
    q: "Is my personal information shared?",
    a: "No. Your contact information is never shown publicly. The only way someone can reach you is through the private messaging system, which requires you to approve the conversation.",
  },
  {
    q: "How do I start a conversation with someone?",
    a: "On any item detail page, click the 'Message' button. This creates a private conversation thread between you and the item's reporter. You'll receive email notifications for new messages.",
  },
  {
    q: "How does the matching engine work?",
    a: "Our matching engine automatically compares new lost item reports against existing found reports (and vice versa). When it finds a potential match with a high similarity score, it creates a match suggestion and sends you a notification.",
  },
  {
    q: "What should I do if I found an item?",
    a: "Report it using the 'Report Found Item' form. Include as much detail as possible (photos, location, time, distinguishing features). The more detail you provide, the easier it is to find the owner.",
  },
  {
    q: "What if I suspect a scam or fake report?",
    a: "You can report suspicious items using the 'Report' button on any item page. Our moderation team will review flagged reports and take appropriate action.",
  },
  {
    q: "How do I mark an item as returned?",
    a: "If you're the original reporter of a lost item and it has been returned, you can mark it as recovered from your dashboard. This helps us track successful returns and remove the item from active searches.",
  },
  {
    q: "Can I edit or delete my report?",
    a: "Yes. You can edit or delete your own reports from your dashboard at any time before they are recovered or removed.",
  },
];

export const metadata = {
  title: "FAQ — Lost & Found Questions Answered",
  description:
    "Answers to common questions about reporting, searching for, and safely returning lost and found items on FindBack PH.",
};

export default function FAQPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-eyebrow !justify-center !gap-0 before:hidden">Help center</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Find answers to common questions about FindBack PH.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-card border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md transition-colors open:border-blue-200/80 hover:border-blue-200/60"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-navy-900">
                <span>{faq.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform duration-300 group-open:rotate-180">
                  <ChevronDown size={16} />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-card border border-slate-200/70 bg-white/70 p-6 text-center shadow-soft backdrop-blur-md">
          <p className="text-slate-600">Still have questions?</p>
          <Link
            href="/contact"
            className="mt-1 inline-block font-medium text-blue-600 hover:underline"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
