import { ReportWizard } from "@/components/reports/report-wizard";

export const metadata = {
  title: "Report a found item — FindBack PH",
  description:
    "Found something in the Philippines? Report it here and we'll help match it with its owner for a safe return.",
};

export default function ReportFoundPage() {
  return <ReportWizard kind="found" />;
}
