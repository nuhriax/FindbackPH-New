"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, Clock, Mail, ShieldCheck } from "lucide-react";
import { submitContactAction } from "@/lib/actions/contact";
import { MotionReveal } from "@/components/effects/motion-reveal";
import { Aurora } from "@/components/effects/aurora";

export default function ContactPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitContactAction(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (result && "success" in result && result.success) {
        setSuccess(true);
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-slate-200/70">
        {/* Living aurora light drifting behind the contact header */}
        <Aurora opacity={0.3} blur={70} />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="relative mx-auto max-w-3xl text-center">
            <MotionReveal>
              <span className="section-eyebrow">We&apos;re here to help</span>
            </MotionReveal>
            <MotionReveal delay={70}>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">
                Contact FindBack PH
              </h1>
            </MotionReveal>
            <MotionReveal delay={140}>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                Questions, feedback, or a partnership idea? Send us a note and we&apos;ll get
                back to you — usually within one business day.
              </p>
            </MotionReveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          {/* Info column */}
          <MotionReveal className="space-y-4">
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                  <Mail size={18} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-navy-900">General enquiries</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    hello@findback.ph
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                  <Clock size={18} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-navy-900">Response time</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    We reply to most messages within one business day, Mon–Fri, 9am–6pm PHT.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-navy-900">Privacy first</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    We only use your details to respond to your message. We never sell or share
                    your personal information.
                  </p>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* Form column */}
          <div className="card p-6 sm:p-8">
            {success ? (
              <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={26} />
                </span>
                <h2 className="mt-5 font-display text-xl font-bold text-navy-900">Message sent</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  Thanks for reaching out. We&apos;ve received your message and will get back to
                  you shortly.
                </p>
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="label">Your name</label>
                    <input id="name" name="name" type="text" required maxLength={80} className="input" placeholder="Juan Dela Cruz" />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email address</label>
                    <input id="email" name="email" type="email" required maxLength={160} className="input" placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="label">Subject</label>
                  <input id="subject" name="subject" type="text" required maxLength={120} className="input" placeholder="How can we help?" />
                </div>

                <div>
                  <label htmlFor="message" className="label">Message</label>
                  <textarea id="message" name="message" required minLength={10} maxLength={3000} rows={6} className="input resize-y" placeholder="Tell us a little more…" />
                </div>

                {error && <p className="field-error" role="alert">{error}</p>}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    By submitting, you agree to our{" "}
                    <a href="/privacy" className="font-medium text-blue-600 hover:underline">privacy policy</a>.
                  </p>
                  <button type="submit" disabled={isPending} className="btn-primary">
                    {isPending ? "Sending…" : "Send message"}
                    {!isPending && <ArrowRight size={16} />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}