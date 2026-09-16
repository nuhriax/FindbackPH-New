import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportWizard } from "@/components/reports/report-wizard";

export const metadata = {
  title: "Report a found item — FindBack PH",
  description:
    "Found something in the Philippines? Report it here and we'll help match it with its owner for a safe return.",
};

// Defense-in-depth (F-001b): middleware already redirects signed-out visitors
// away from /report/*, but this server gate keeps the wizard unreachable even
// if middleware is bypassed or misconfigured. Submit actions re-check auth.
export default async function ReportFoundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/report/found");
  return <ReportWizard kind="found" />;
}
