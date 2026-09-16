import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportWizard } from "@/components/reports/report-wizard";

export const metadata = {
  title: "Report a lost item — FindBack PH",
  description:
    "Report something you lost in the Philippines. We match it against found reports and alert you when a promising one appears.",
};

// Defense-in-depth (F-001b): middleware already redirects signed-out visitors
// away from /report/*, but this server gate keeps the wizard unreachable even
// if middleware is bypassed or misconfigured. Submit actions re-check auth.
export default async function ReportLostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/report/lost");
  return <ReportWizard kind="lost" />;
}
