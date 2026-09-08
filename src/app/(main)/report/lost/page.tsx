import { ReportWizard } from "@/components/reports/report-wizard";

export const metadata = {
  title: "Report a lost item — FindBack PH",
  description:
    "Report something you lost in the Philippines. We match it against found reports and alert you when a promising one appears.",
};

export default function ReportLostPage() {
  return <ReportWizard kind="lost" />;
}
