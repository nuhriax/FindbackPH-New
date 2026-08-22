import type { Metadata } from "next";
import { LegalExplorer, type LegalSection } from "@/components/legal/legal-explorer";

export const metadata: Metadata = {
  title: "Terms of Service - FindBack PH",
  description:
    "The terms that govern your use of FindBack PH and its community-powered lost and found platform.",
};

const sections: LegalSection[] = [
  {
    id: "what",
    number: "01",
    title: "What FindBack PH is",
    blocks: [
      {
        type: "p",
        text: "FindBack PH is a community-powered platform that helps people in the Philippines reconnect lost and found items. Users can post reports about items they have lost or found, search existing reports, and message each other privately through the platform.",
      },
    ],
  },
  {
    id: "responsibilities",
    number: "02",
    title: "Your responsibilities",
    blocks: [
      {
        type: "p",
        text: "When you use FindBack PH, you agree to:",
      },
      {
        type: "list",
        items: [
          "Provide accurate information in your reports.",
          "Not post fake, misleading, or harmful reports.",
          "Respect other users and not harass or threaten anyone.",
          "Not attempt to scam other users or misrepresent yourself.",
          "Arrange safe, public, in-person meetups when exchanging items.",
          "Follow all applicable Philippine laws.",
        ],
      },
    ],
  },
  {
    id: "share",
    number: "03",
    title: "What you should not share",
    blocks: [
      {
        type: "p",
        text: "Never share passwords, OTPs (one-time passwords), banking information, full home addresses, or other sensitive personal information through the platform or during a meetup. Keep communication within FindBack PH and use the private messaging system.",
      },
    ],
  },
  {
    id: "content",
    number: "04",
    title: "Content you post",
    blocks: [
      {
        type: "p",
        text: "You retain ownership of the content you post. By posting a report, you grant FindBack PH a non-exclusive license to display it on the platform so other users can view and search it.",
      },
    ],
  },
  {
    id: "account",
    number: "05",
    title: "Account & conduct",
    blocks: [
      {
        type: "p",
        text: "You are responsible for keeping your account credentials secure. If you abuse the platform - for example, by posting fake reports or harassing other users - we may suspend or remove your account, and we may also remove individual reports that violate these terms.",
      },
    ],
  },
  {
    id: "reporting",
    number: "06",
    title: "Reporting issues",
    blocks: [
      {
        type: "p",
        text: "If you see content that seems like a scam, a fake report, harassment, or otherwise inappropriate, please use the Report option on the item page. Our moderators will review it.",
      },
    ],
  },
  {
    id: "liability",
    number: "07",
    title: "Limitation of liability",
    blocks: [
      {
        type: "p",
        text: "FindBack PH is a platform that connects users. We are not a party to any agreement between users and we do not guarantee that any item will be recovered or returned. Arranging meetups and exchanging items is entirely between the users involved. You use the platform at your own risk.",
      },
    ],
  },
  {
    id: "changes",
    number: "08",
    title: "Changes to these terms",
    blocks: [
      {
        type: "p",
        text: "We may update these terms from time to time. When we make significant changes, we will update this page. Continued use of the platform after changes means you accept the updated terms.",
      },
    ],
  },
  {
    id: "contact",
    number: "09",
    title: "Contact",
    blocks: [
      {
        type: "p",
        text: "If you have questions about these terms, please reach out through our help page. You can also read our Privacy Policy.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalExplorer
      eyebrow="Legal & transparency"
      title="Terms of Service"
      subtitle="The terms that govern your use of FindBack PH and its community-powered lost and found platform."
      lastUpdated="Last updated: August 2025"
      sections={sections}
      cta={{
        title: "Have a question about the terms?",
        text: "We are happy to help you understand.",
        actions: [
          { label: "Read Privacy Policy", href: "/privacy" },
          { label: "Contact us", href: "/contact", primary: true },
        ],
      }}
    />
  );
}
