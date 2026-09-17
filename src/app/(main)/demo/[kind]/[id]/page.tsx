import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ReportDetail } from "@/components/reports/report-detail";
import { DEMO_MODE } from "@/lib/demo/config";
import { getDemoDetail } from "@/lib/demo/fixture";
import { getDemoMatches, getDemoSimilar } from "@/lib/demo/mock-discover";

export const metadata = {
  title: { absolute: "Demo report — FindBack PH (sample data)" },
  robots: { index: false, follow: false },
};

/**
 * Demo report detail — the REAL ReportDetail composition (gallery, reporter
 * card, action area, matches, similar rail) rendered with a clearly-labeled
 * sample report. RLS/auth are untouched: the real detail pages keep their own
 * gates; this page only exists in local demo mode.
 */
export default async function DemoReportDetailPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  if (!DEMO_MODE) notFound();

  const { kind, id } = await params;
  if (kind !== "lost" && kind !== "found") notFound();

  const demo = getDemoDetail(kind, id);
  if (!demo) notFound();

  return (
    <ReportDetail
      kind={kind}
      item={demo.item}
      images={demo.images}
      reporter={demo.reporter}
      // Demo keeps trust badges off — those reflect real, verifiable signals
      // (email confirmation, returns) that a fictional sample must not claim.
      trust={null}
      ownership={null}
      isOwner={false}
      savedItemId={null}
      matches={getDemoMatches(id)}
      similarItems={getDemoSimilar(id)}
      backHref="/demo/discover"
      backLabel="Back to demo feed"
      matchHref={(matchId) =>
        `/demo/${matchId.startsWith("demo-lost") ? "lost" : "found"}/${matchId}`
      }
      breadcrumbTrail={
        <nav aria-label="Breadcrumb" className="mb-4">
          <Link
            href="/demo/discover"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-electric-700"
          >
            <ChevronLeft size={15} aria-hidden />
            Demo feed
          </Link>
        </nav>
      }
    />
  );
}
