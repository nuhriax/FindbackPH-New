"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { submitContactAction } from "@/lib/actions/contact";
import { MotionReveal } from "@/components/effects/motion-reveal";
import Link from "next/link";

const quickLinks = [
  { label: "How matching works", href: "/faq" },
  { label: "Safety tips for meetups", href: "/safety" },
  { label: "Report a lost item", href: "/report/lost" },
];

export default function ContactPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msgLen, setMsgLen] = useState(0);
  const [copied, setCopied] = useState(false);

  const supportEmail = "Findbackph.support@gmail.com";
  const composeHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Inquiry for FindBack PH"
  )}&body=${encodeURIComponent("Hi FindBack PH team,\n\n")}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — ignore silently
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await submitContactAction(formData);

        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.success) {
          setSuccess(true);
        }
      } catch {
        setError(
          "Something went wrong while sending your message. Please try again."
        );
      }
    });
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        aria-labelledby="contact-heading"
        className="border-b border-slate-200/50"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <MotionReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-emerald-500"
                />
                Contact &amp; Support
              </span>
            </MotionReveal>

            <MotionReveal delay={70}>
              <h1
                id="contact-heading"
                className="mt-6 font-display text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl"
              >
                Get in touch with our support team
              </h1>
            </MotionReveal>

            <MotionReveal delay={140}>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                For inquiries, feedback, or partnership opportunities, please
                reach out to our team. We respond to all messages within one
                business day.
              </p>
            </MotionReveal>

            {/* Structured stats row */}
            <MotionReveal delay={210}>
              <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 divide-x divide-slate-200/70">
                {[
                  {
                    icon: Clock,
                    value: "Within 24 hours",
                    label: "Response time",
                  },
                  {
                    icon: ShieldCheck,
                    value: "Confidential",
                    label: "Your privacy",
                  },
                  {
                    icon: Mail,
                    value: "Philippines",
                    label: "Local support team",
                  },
                ].map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center px-4 py-2 text-center"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-5 w-5 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <dt className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-navy-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* Contact content — form first, info sidebar second */}
      <section
        aria-labelledby="contact-form-heading"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          {/* Form — primary */}
          <MotionReveal>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-electric-400/25 via-transparent to-amber-400/25 opacity-60 blur-xl transition-opacity duration-500"
              />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-electric-600 via-electric-400 to-amber-500" />

                {success ? (
                  <SuccessState />
                ) : (
                  <form
                    action={handleSubmit}
                    className="p-6 sm:p-8"
                    noValidate={false}
                  >
                    <div className="mb-7 flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 sm:flex"
                      >
                        <Mail size={20} strokeWidth={2} />
                      </span>
                      <div>
                        <h2
                          id="contact-form-heading"
                          className="font-display text-xl font-bold text-navy-900"
                        >
                          Send us a message
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Tell us what&apos;s on your mind and our team will
                          take it from there.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          id="name"
                          name="name"
                          label="Your name"
                          type="text"
                          placeholder="Juan Dela Cruz"
                          maxLength={80}
                          autoComplete="name"
                        />

                        <Field
                          id="email"
                          name="email"
                          label="Email address"
                          type="email"
                          placeholder="you@example.com"
                          maxLength={160}
                          autoComplete="email"
                        />
                      </div>

                      <Field
                        id="subject"
                        name="subject"
                        label="Subject"
                        type="text"
                        placeholder="How can we help?"
                        maxLength={120}
                      />

                      <div>
                        <label htmlFor="message" className="label">
                          Message
                        </label>

                        <textarea
                          id="message"
                          name="message"
                          required
                          minLength={10}
                          maxLength={3000}
                          rows={7}
                          className="input resize-y"
                          placeholder="Tell us a little more…"
                          autoComplete="off"
                          aria-describedby="message-hint"
                          onChange={(e) => setMsgLen(e.target.value.length)}
                        />

                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <p
                            id="message-hint"
                            className={`text-xs transition-colors ${
                              msgLen > 0 && msgLen < 10
                                ? "font-medium text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {msgLen === 0
                              ? "Please include at least 10 characters."
                              : msgLen < 10
                                ? `${10 - msgLen} more character${10 - msgLen === 1 ? "" : "s"} to go…`
                                : "Looks good!"}
                          </p>
                          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                            {msgLen}/3000
                          </span>
                        </div>
                      </div>

                      {error && (
                        <div
                          role="alert"
                          aria-live="polite"
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                        >
                          {error}
                        </div>
                      )}

                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-sm text-xs leading-5 text-slate-500">
                          By submitting, you agree to our{" "}
                          <a
                            href="/privacy"
                            className="font-medium text-blue-600 underline-offset-2 hover:underline"
                          >
                            privacy policy
                          </a>
                          .
                        </p>

                        <button
                          type="submit"
                          disabled={isPending}
                          aria-disabled={isPending}
                          className="btn-primary min-w-[145px] justify-center disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPending ? (
                            <>
                              <span
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                              />
                              Sending…
                            </>
                          ) : (
                            <>
                              Send message
                              <ArrowRight size={16} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </MotionReveal>

          {/* Info sidebar */}
          <MotionReveal delay={80} className="space-y-4">
            {/* Email card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                >
                  <Mail size={16} strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold text-navy-900">
                  Email us
                </h2>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-3 pr-1.5">
                <button
                  type="button"
                  onClick={copyEmail}
                  title="Click to copy email address"
                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium text-slate-700 transition-colors hover:text-navy-900"
                >
                  {supportEmail}
                </button>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-live="polite"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:text-navy-900"
                >
                  {copied ? (
                    <>
                      <CheckCircle2
                        size={13}
                        aria-hidden="true"
                        className="text-emerald-600"
                      />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <a
                href={composeHref}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-navy-800"
              >
                <Mail size={13} aria-hidden="true" />
                Send us an email
              </a>
            </div>

            {/* Response time + privacy */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
              <ul className="divide-y divide-slate-100">
                {[
                  {
                    icon: Clock,
                    title: "Response time",
                    body: "Most messages are answered within one business day, Mon–Fri, 9am–6pm PHT.",
                    tint: "border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Privacy first",
                    body: "Your details are only used to reply to you. We never sell or share your information.",
                    tint: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600",
                  },
                ].map(({ icon: Icon, title, body, tint }) => (
                  <li
                    key={title}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tint}`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-navy-900">
                        {title}
                      </h2>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick answers */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
                Need answers fast?
              </h2>
              <ul className="mt-3 space-y-1">
                {quickLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-white hover:text-blue-700"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] text-slate-400 transition-colors group-hover:border-blue-300 group-hover:text-blue-600"
                        >
                          →
                        </span>
                        {label}
                      </span>
                      <ArrowUpRight
                        size={14}
                        aria-hidden="true"
                        className="text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-500"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </MotionReveal>
        </div>
      </section>

    </main>
  );
}

function Field({
  id,
  name,
  label,
  type,
  placeholder,
  maxLength,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type: "text" | "email";
  placeholder: string;
  maxLength: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        required
        maxLength={maxLength}
        className="input"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function SuccessState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[30rem] flex-col items-center justify-center px-6 py-12 text-center sm:px-8"
    >
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 size={28} strokeWidth={2} />
      </span>

      <h2 className="mt-6 font-display text-2xl font-bold text-navy-900">
        Message sent
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
        Thanks for reaching out. We&apos;ve received your message and will get
        back to you shortly.
      </p>

      <p className="mt-4 text-xs text-slate-500">
        We&apos;ll reply to the email address you provided.
      </p>
    </div>
  );
}
