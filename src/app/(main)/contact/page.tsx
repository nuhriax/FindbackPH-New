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

const contactInfo = [
  {
    icon: Mail,
    title: "General enquiries",
    description: "FindBackph.support@gmail.com",
    iconClass:
      "border-blue-200 bg-blue-50 text-blue-600",
  },
  {
    icon: Clock,
    title: "Response time",
    description:
      "We reply to most messages within one business day, Mon–Fri, 9am–6pm PHT.",
    iconClass:
      "border-violet-200 bg-violet-50 text-violet-600",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description:
      "We only use your details to respond to your message. We never sell or share your personal information.",
    iconClass:
      "border-emerald-200 bg-emerald-50 text-emerald-600",
  },
];

export default function ContactPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        aria-labelledby="contact-heading"
        className="relative isolate overflow-hidden border-b border-slate-200/70"
      >
        <Aurora opacity={0.3} blur={70} />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <MotionReveal>
              <span className="section-eyebrow">
                We&apos;re here to help
              </span>
            </MotionReveal>

            <MotionReveal delay={70}>
              <h1
                id="contact-heading"
                className="mt-4 font-display text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl lg:text-6xl"
              >
                Contact FindBack PH
              </h1>
            </MotionReveal>

            <MotionReveal delay={140}>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Questions, feedback, or a partnership idea? Send us a note and
                we&apos;ll get back to you — usually within one business day.
              </p>
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
              ({ icon: Icon, title, description, iconClass }) => (
                <div key={title} className="card p-6">
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
                    >
                      <Icon size={19} strokeWidth={2} />
                    </span>

                    <div>
                      <h2 className="font-display text-base font-semibold text-navy-900">
                        {title}
                      </h2>

                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {title === "General enquiries" ? (
                          <a
                            href="mailto:hello@findback.ph"
                            className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                          >
                            {description}
                          </a>
                        ) : (
                          description
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </MotionReveal>

          {/* Form */}
          <div className="card overflow-hidden">
            {success ? (
              <SuccessState />
            ) : (
              <form
                action={handleSubmit}
                className="p-6 sm:p-8"
                noValidate={false}
              >
                <div className="mb-7">
                  <h2
                    id="contact-form-heading"
                    className="font-display text-xl font-bold text-navy-900"
                  >
                    Send us a message
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Tell us what&apos;s on your mind and our team will take it
                    from there.
                  </p>
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
                    />

                    <p
                      id="message-hint"
                      className="mt-1.5 text-xs text-slate-500"
                    >
                      Please include at least 10 characters.
                    </p>
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