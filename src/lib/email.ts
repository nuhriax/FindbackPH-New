import "server-only";

/**
 * Transactional email helper — server-only.
 *
 * Sends email through the SAME Gmail SMTP account already used by Supabase Auth
 * (credentials come from .env.local / Vercel env vars — never hardcoded).
 *
 * Design rules:
 *  - Fail-safe: callers treat email as best-effort. A failed send is logged but
 *    NEVER breaks the user's action (e.g. a contact submission is still saved).
 *  - Server-only: this module is imported exclusively from server actions, and
 *    `server-only` guarantees it can never leak into a client bundle.
 */

export const EMAIL_FROM_NAME = "FindBack PH";

type ContactEmailParams = {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: Date;
};

/**
 * Sends a "new contact message" notification to the support inbox.
 * Recipient defaults to the SMTP account itself (findbackph.support@gmail.com)
 * and can be overridden with CONTACT_NOTIFY_EMAIL.
 */
export async function sendContactNotificationEmail(
  params: ContactEmailParams
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 587);

  // SMTP not configured (e.g. local dev without env) — skip silently.
  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured — contact notification skipped");
    return;
  }

  const to = process.env.CONTACT_NOTIFY_EMAIL || user;
  const receivedAt = (
    params.createdAt ?? new Date()
  ).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  // Escape user-provided text before interpolating into HTML.
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
      <h2 style="margin:0 0 4px;font-size:18px;">New contact message</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px;">Received ${esc(receivedAt)} (PHT)</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:90px;">From</td><td style="padding:6px 0;font-weight:600;">${esc(params.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;">${esc(params.email)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Subject</td><td style="padding:6px 0;font-weight:600;">${esc(params.subject)}</td></tr>
      </table>
      <div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.6;">${esc(params.message)}</div>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">
        View and manage in the admin inbox: findbackph.me/admin/messages<br/>
        Reply directly to this email to reach ${esc(params.name)} at ${esc(params.email)}.
      </p>
    </div>`;

  try {
    // Lazy import keeps cold-start light when email is never used.
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${user}>`,
      to,
      replyTo: params.email,
      subject: `[FindBackPH contact] ${params.subject}`,
      text: `From: ${params.name} <${params.email}>\nReceived: ${receivedAt} (PHT)\n\n${params.message}`,
      html,
    });
  } catch (error) {
    // Fail-safe: log for diagnostics, never propagate to the caller.
    console.error("[email] Contact notification failed:", error);
  }
}
