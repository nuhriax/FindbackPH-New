"use server";

import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation";

export type ActionResult = { error: string } | { success: boolean } | { error?: undefined; success?: undefined };

/**
 * Persists a contact form submission. The submitter's id is stored (only if
 * signed in) so moderators can follow up, but it's optional — anyone can reach out.
 */
export async function submitContactAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? "",
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("Contact submission error:", error);
    return { error: "We couldn't send your message. Please try again." };
  }

  return { success: true };
}