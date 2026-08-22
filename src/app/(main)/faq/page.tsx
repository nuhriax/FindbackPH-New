import type { Metadata } from "next";
import { FaqExplorer, type Faq } from "@/components/faq/faq-explorer";

export const metadata: Metadata = {
  title: "FAQ - Lost & Found Questions Answered",
  description:
    "Find answers to common questions about reporting, searching for, matching, and safely returning lost and found items on FindBack PH.",
};

const faqs: Faq[] = [
  {
    q: "What is FindBack PH?",
    a: "FindBack PH is a community-powered lost and found platform for the Philippines. If you've lost something, you can post a lost-item report. If you've found something, you can create a found-item report. Our platform helps connect the two so items can be safely returned to their owners.",
  },
  {
    q: "Is FindBack PH free to use?",
    a: "Yes. FindBack PH is completely free for everyone. There are no fees for reporting an item, searching listings, or messaging other users.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No. Anyone can browse lost and found reports without creating an account. However, you'll need an account to report an item, save listings, or start a private conversation with another user.",
  },
  {
    q: "Is my personal information shared?",
    a: "No. Your personal contact information is not displayed publicly. Communication happens through our private messaging system, so you get to decide who you communicate with.",
  },
  {
    q: "How do I contact someone about an item?",
    a: "Open the item's detail page and click the Message button. This starts a private conversation with the person who reported the item. You'll also receive email notifications when you receive new messages.",
  },
  {
    q: "How does the matching system work?",
    a: "FindBack PH automatically compares lost-item reports with found-item reports, looking at details such as category, location, description, and other relevant information. When a potentially strong match is identified, we create a match suggestion and notify the relevant users.",
  },
  {
    q: "What should I do if I find someone's item?",
    a: "Create a found-item report and provide as much useful information as possible. Photos, the location where you found the item, the approximate time, and distinguishing characteristics can all help the owner identify it.",
  },
  {
    q: "What if I suspect a scam or fake report?",
    a: "Use the Report button on the item's detail page to flag suspicious activity. Our moderation team can review reported content and take appropriate action when necessary.",
  },
  {
    q: "How do I mark an item as returned?",
    a: "If you're the person who originally reported the lost item, you can mark it as recovered from your dashboard once it has been returned. This helps keep the platform accurate and removes the item from active searches.",
  },
  {
    q: "Can I edit or delete my report?",
    a: "Yes. You can edit or delete your own reports from your dashboard, subject to the report's current status. Keeping your reports up to date helps other users find accurate information.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqExplorer faqs={faqs} />
    </>
  );
}
