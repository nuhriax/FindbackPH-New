import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const dynamic = "force-dynamic";

/**
 * Onboarding gate for Google/Facebook sign-ups. Signed-in members whose
 * profile is missing a real name must complete this before the dashboard.
 * Prefills whatever the provider gave us (given_name / family_name / full_name)
 * so most people only have to confirm and pick a username.
 */
export default async function CompleteProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  // Already has a real name — nothing to do here.
  const incomplete =
    !profile || !profile.first_name?.trim() || !profile.last_name?.trim();
  if (!incomplete) redirect("/dashboard");

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const fullName = meta.full_name?.trim() ?? "";
  const nameParts = fullName ? fullName.split(/\s+/) : [];

  const defaultFirstName =
    profile?.first_name?.trim() ||
    meta.given_name?.trim() ||
    meta.first_name?.trim() ||
    nameParts[0] ||
    "";
  const defaultLastName =
    profile?.last_name?.trim() ||
    meta.family_name?.trim() ||
    meta.last_name?.trim() ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  return (
    <CompleteProfileForm
      defaultFirstName={defaultFirstName}
      defaultLastName={defaultLastName}
      defaultUsername={profile?.username ?? ""}
    />
  );
}