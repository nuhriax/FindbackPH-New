import type { Metadata } from "next";
import { LegalExplorer, type LegalSection } from "@/components/legal/legal-explorer";

export const metadata: Metadata = {
  title: "Privacy Policy - FindBack PH",
  description:
    "Learn how FindBack PH collects, uses, and protects your personal information.",
};

const sections: LegalSection[] = [
  {
    id: "collection",
    number: "01",
    title: "Information we collect",
    blocks: [
      {
        type: "p",
        text: "Depending on how you use FindBack PH, we may collect information that you voluntarily provide or that is generated when you use the service.",
      },
      {
        type: "list",
        items: [
          "Account information: your name, email address, username, and authentication-related information.",
          "Reports: item titles, categories, descriptions, locations, dates, and photos you choose to upload.",
          "Messages: messages and other information you send through conversations.",
          "Technical information: limited device, browser, IP address, and diagnostic information where applicable.",
        ],
      },
    ],
  },
  {
    id: "use",
    number: "02",
    title: "How we use information",
    blocks: [
      {
        type: "p",
        text: "We use your information to provide and maintain FindBack PH and to make the platform useful and safe.",
      },
      {
        type: "list",
        items: [
          "Create and maintain your account.",
          "Allow you to create and manage reports.",
          "Help users discover potential matches.",
          "Enable communication between users.",
          "Send important account notifications.",
          "Prevent abuse, fraud, and misuse.",
          "Maintain and improve the service.",
          "Comply with applicable legal obligations.",
        ],
      },
    ],
  },
  {
    id: "public",
    number: "03",
    title: "Public information",
    blocks: [
      {
        type: "p",
        text: "FindBack PH is a community platform. Information you intentionally include in a public report may therefore be visible to other users.",
      },
      {
        type: "callout",
        tone: "amber",
        title: "Please protect sensitive information",
        text: "Do not include passwords, government IDs, bank information, home addresses, phone numbers, or other sensitive personal information in a public report unless it is genuinely necessary.",
      },
      {
        type: "p",
        text: "Your email address and private account information are not intended to be publicly displayed through your profile or reports.",
      },
    ],
  },
  {
    id: "messages",
    number: "04",
    title: "Private messages",
    blocks: [
      { type: "p", text: "Messages sent through FindBack PH are intended to be private communications between the participants in a conversation. We store messages so conversations can function and remain available to participants." },
      { type: "p", text: "We may process messages when reasonably necessary to investigate abuse, protect users, prevent fraud, or comply with legal requirements." },
    ],
  },
  {
    id: "sharing",
    number: "05",
    title: "Sharing information",
    blocks: [
      { type: "p", text: "We do not sell your personal information. We may, however, disclose information when reasonably necessary to provide the service or fulfill legal and security obligations." },
      { type: "p", text: "This may include service providers that help with hosting, databases, storage, authentication, email, analytics, security, or other infrastructure." },
      { type: "p", text: "We may also disclose information when required by law, legal process, or a valid government request, or when reasonably necessary to protect users or others." },
    ],
  },
  {
    id: "security",
    number: "06",
    title: "Security & retention",
    blocks: [
      { type: "p", text: "We use reasonable technical and organizational measures designed to protect personal information from unauthorized access, loss, misuse, alteration, or disclosure." },
      { type: "p", text: "No online service can guarantee absolute security. You are responsible for keeping your password confidential and should contact us if you believe your account has been compromised." },
      { type: "p", text: "We retain information for as long as reasonably necessary to provide the service, maintain security and business records, resolve disputes, enforce agreements, and comply with applicable legal obligations." },
    ],
  },
  {
    id: "choices",
    number: "07",
    title: "Your choices",
    blocks: [
      { type: "p", text: "You can edit or delete your reports where those features are available. You can also manage notification preferences through the settings provided by the service." },
      { type: "p", text: "Depending on applicable law, you may request access, correction, updating, or deletion of certain personal information." },
    ],
  },
  {
    id: "photos",
    number: "08",
    title: "Photos & sensitive data",
    blocks: [
      { type: "p", text: "Photos can contain information you may not intend to publish, including documents, faces, addresses, license plates, or other identifying details." },
      { type: "callout", tone: "slate", title: "Before uploading a photo", items: ["Check for government IDs or passports.", "Remove bank or payment information.", "Avoid showing passwords or private addresses.", "Blur sensitive information when possible."] },
    ],
  },
  {
    id: "cookies",
    number: "09",
    title: "Cookies & technology",
    blocks: [
      { type: "p", text: "FindBack PH may use cookies, local storage, or similar technologies to keep you signed in, remember preferences, maintain security, understand how the service is used, and improve functionality." },
      { type: "p", text: "Some technologies may be necessary for the platform to function. Where required by applicable law, we will provide appropriate choices regarding non-essential technologies." },
    ],
  },
  {
    id: "children",
    number: "10",
    title: "Children's privacy",
    blocks: [
      { type: "p", text: "FindBack PH is not intended to knowingly collect children's personal information in circumstances where doing so would violate applicable law." },
      { type: "p", text: "If you believe a child has provided personal information improperly, please contact us so we can review the situation and take appropriate action." },
    ],
  },
  {
    id: "changes",
    number: "11",
    title: "Changes to this policy",
    blocks: [
      { type: "p", text: "We may update this Privacy Policy when our service, practices, or legal obligations change. When we make changes, we will update this page." },
      { type: "p", text: "Where appropriate, we may provide additional notice for significant changes." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalExplorer
      eyebrow="Legal & transparency"
      title="Privacy Policy"
      subtitle="How FindBack PH collects, uses, and protects your personal information."
      lastUpdated="Last updated: August 22, 2026"
      sections={sections}
      cta={{
        title: "Have a privacy question?",
        text: "Contact the FindBack PH team through the platform.",
        actions: [
          { label: "Read Terms of Service", href: "/terms" },
          { label: "Contact us", href: "/contact", primary: true },
        ],
      }}
    />
  );
}
