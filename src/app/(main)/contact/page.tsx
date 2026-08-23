"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { submitContactAction } from "@/lib/actions/contact";
import { MotionReveal } from "@/components/effects/motion-reveal";
import { Aurora } from "@/components/effects/aurora";
import Link from "next/link";

const contactInfo = [
  {
    icon: Mail,
    title: "General enquiries",
    description: "FindBackph.support@gmail.com",
    href: "mailto:FindBackph.support@gmail.com",
    actionLabel: "Email us directly",
    iconClass:
      "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.35)]",
  },
  {
    icon: Clock,
    title: "Response time",
    description:
      "We reply to most messages within one business day, Mon–Fri, 9am–6pm PHT.",
    iconClass:
      "border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 shadow-[0_8px_20px_-8px_rgba(124,58,237,0.35)]",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description:
      "We only use your details to respond to your message. We never sell or share your personal information.",
    iconClass:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.35)]",
  },
];

export default function ContactPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msgLen, setMsgLen] = useState(0);

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
        className="relative isolate overflow-hidden border-b border-slate-200/70"
      >
        <Aurora opacity={0.35} blur={80} />

        {/* Decorative orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-electric-400/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <MotionReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 shadow-sm backdrop-blur">
                <span
                  aria-hidden="true"
                  className="relative flex h-2 w-2"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                We&apos;re here to help — online now
              </span>
            </MotionReveal>

            <MotionReveal delay={70}>
              <h1
                id="contact-heading"
                className="mt-6 font-display text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl lg:text-6xl"
              >
                Let&apos;s talk.{" "}
                <span className="bg-gradient-to-r from-blue-600 via-electric-500 to-violet-500 bg-clip-text text-transparent">
                  We reply fast.
                </span>
              </h1>
            </MotionReveal>

            <MotionReveal delay={140}>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Questions, feedback, or a partnership idea? Send us a note and
                we&apos;ll get back to you — usually within one business day.
              </p>
            </MotionReveal>

            <MotionReveal delay={210}>
              <dl className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["< 24h", "Average reply"],
                  ["100%", "Private & secure"],
                  ["PH-based", "Real humans"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-display text-lg font-bold text-navy-900 sm:text-xl">
                      {value}
                    </dd>
                    <dd className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* Contact content */}
      <section
        aria-labelledby="contact-form-heading"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.4fr]">
          {/* Information */}
          <MotionReveal className="space-y-4">
            {contactInfo.map(
              ({ icon: Icon, title, description, href, actionLabel, iconClass }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100/60 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div className="relative flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${iconClass}`}
                    >
                      <Icon size={19} strokeWidth={2} />
                    </span>

                    <div>
                      <h2 className="font-display text-base font-semibold text-navy-900">
                        {title}
                      </h2>

                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {href ? (
                          <a
                            href={href}
                            className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                          >
                            {description}
                          </a>
                        ) : (
                          description
                        )}
                      </p>

                      {href && actionLabel && (
                        <a
                          href={href}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100"
                        >
                          <Mail size={13} aria-hidden="true" />
                          {actionLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Quick answers */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
                Need answers fast?
              </h2>
              <ul className="mt-3 space-y-2">
                {[
                  ["How matching works", "/faq"],
                  ["Safety tips for meetups", "/safety"],
                  ["Report a lost item", "/report/lost"],
                ].map(([label, link]) => (
                  <li key={link}>
                    <Link
                      href={link}
                      className="group inline-flex items-center gap-2 text-sm font-medium text-navy-900 transition-colors hover:text-blue-700"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] text-slate-400 transition-colors group-hover:border-blue-300 group-hover:text-blue-600"
                      >
                        →
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </MotionReveal>

          {/* Form */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-400/25 via-transparent to-violet-400/25 opacity-60 blur-xl transition-opacity duration-500"
            />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl">
              {/* Form header strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-electric-400 to-violet-500" />

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
                        Tell us what&apos;s on your mind and our team will take it
                        from there.
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
        </div>
      </section>

      {/* Bottom CTA */}
      <section aria-label="Report an item" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-navy-900 via-blue-950 to-violet-950 px-6 py-12 text-center shadow-[0_35px_100px_-25px_rgba(15,23,42,0.5)] sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-electric-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl"
            />
            <h2 className="relative font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Lost or found something?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100/90 sm:text-base">
              Don&apos;t wait for a reply — post a report right now and let our
              matching engine start working for you immediately.
            </p>
            <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/report/lost"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl"
              >
                Report a lost item
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/report/found"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
              >
                I found something
              </Link>
            </div>
          </div>
        </MotionReveal>
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