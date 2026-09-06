import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Inbox, Mail, MailOpen, CheckCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/actions/admin";
import {
  markMessageReadAction,
  markAllMessagesReadAction,
} from "@/lib/actions/contact-admin";
import type { ContactMessage } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (messages ?? []) as ContactMessage[];
  const unread = rows.filter((m) => m.status === "new").length;

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-navy-900">
            <Inbox size={18} className="text-electric-600" />
            Contact Messages
            {unread > 0 && (
              <span className="rounded-full bg-sunrise-500 px-2 py-0.5 text-xs font-bold text-white">
                {unread} new
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enquiries submitted through the contact form.
          </p>
        </div>

        {unread > 0 && (
          <form action={markAllMessagesReadAction}>
            <button type="submit" className="btn-secondary !py-2 text-xs">
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {/* Message list */}
      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
          <Inbox size={32} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-navy-900">No messages yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Contact form submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((m) => {
            const isNew = m.status === "new";
            return (
              <article
                key={m.id}
                className={`rounded-2xl border bg-white/70 p-5 shadow-soft backdrop-blur-md transition ${
                  isNew ? "border-sunrise-200" : "border-slate-200/70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isNew
                            ? "border-sunrise-200 bg-sunrise-50 text-sunrise-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isNew ? <Mail size={10} /> : <MailOpen size={10} />}
                        {isNew ? "New" : "Read"}
                      </span>
                      <h3 className="truncate font-display text-sm font-semibold text-navy-900">
                        {m.subject}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{m.name}</span>
                      {" · "}
                      <a
                        href={`mailto:${m.email}`}
                        className="text-electric-600 hover:text-electric-700 hover:underline"
                      >
                        {m.email}
                      </a>
                      {" · "}
                      {format(new Date(m.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {isNew && (
                    <form action={markMessageReadAction.bind(null, m.id)}>
                      <button type="submit" className="btn-secondary !py-1.5 text-xs">
                        <MailOpen size={13} />
                        Mark as read
                      </button>
                    </form>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {m.message}
                </p>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-electric-600 hover:text-electric-700"
                  >
                    Reply to {m.name.split(" ")[0]}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Showing up to 200 most recent messages ·{" "}
        <Link href="/contact" className="hover:text-slate-600">
          view public form
        </Link>
      </p>
    </div>
  );
}
