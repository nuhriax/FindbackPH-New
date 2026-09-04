import { CheckCircle2 } from "lucide-react";

import { MessageButton } from "@/components/message-button";
import { SaveButton } from "@/components/save-button";
import { ReportFlagButton } from "@/components/report-flag-button";
import { UserReportButton } from "@/components/user-report-button";
import { ReportOwnerActions } from "@/components/reports/report-owner-actions";
import { ReportEditToggle } from "@/components/reports/report-edit-toggle";
import type { DetailItem } from "../report-detail-types";

/* ============================================================
   ACTION CARD — sticky sidebar with the reward, primary CTA
   (message/save or owner controls) and report metadata, so the
   key actions stay visible while scrolling the details.
============================================================ */

export function ActionCard({
  isOwner,
  isLost,
  itemType,
  item,
  images,
  savedItemId,
  reportDate,
  reporterName,
}: {
  isOwner: boolean;
  isLost: boolean;
  itemType: "lost_item" | "found_item";
  item: DetailItem;
  images: { id: string; url: string }[];
  savedItemId: string | null;
  reportDate: string;
  reporterName: string;
}) {
  const firstName = reporterName.split(" ")[0] || "them";

  return (
    <div>
      {/* Guided flow — contextual to the report type:
          lost item → you found it; found item → it might be yours. */}
      {!isOwner && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-3 py-2 text-[10px] font-semibold text-slate-500">
          {(isLost
            ? [
                ["1", "Reach out"],
                ["2", "Meet safely"],
                ["3", "Return it"],
              ]
            : [
                ["1", "Prove it's yours"],
                ["2", "Coordinate"],
                ["3", "Get it back"],
              ]
          ).map(([n, step], i, arr) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className="flex items-center gap-1">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${
                    i === arr.length - 1 ? "bg-emerald-600" : "bg-electric-600"
                  }`}
                >
                  {n}
                </span>
                {step}
              </span>

              {i < arr.length - 1 && (
                <span className="ml-0.5 text-slate-300">→</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Primary actions */}
      {!isOwner ? (
        <div className="mt-3 space-y-2.5">
          <MessageButton
            itemType={itemType}
            itemId={item.id}
            label={
              isLost ? `Contact ${firstName}` : "Prove It's Yours"
            }
          />

          <SaveButton
            lostItemId={isLost ? item.id : undefined}
            foundItemId={!isLost ? item.id : undefined}
            savedItemId={savedItemId}
            isOwner={isOwner}
          />
        </div>
      ) : item.status !== "recovered" ? (
        <ReportEditToggle
          kind={itemType}
          images={images}
          item={{
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description ?? "",
            distinguishingFeatures: item.distinguishingFeatures,
            city: item.city ?? "",
            province: item.province ?? "",
            approximateLocation: item.approximateLocation,
            dateString: item.dateOccurred
              ? String(item.dateOccurred).slice(0, 10)
              : "",
            reward: isLost ? item.reward : null,
            holdingInfo: isLost ? null : item.holdingInfo ?? null,
          }}
        >
          <ReportOwnerActions
            itemType={itemType}
            itemId={item.id}
            status={item.status as any}
          />
        </ReportEditToggle>
      ) : (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-emerald-50
            px-4
            py-3.5
            text-sm
            font-semibold
            text-emerald-700
          "
        >
          <CheckCircle2 size={17} />
          This report has been recovered
        </div>
      )}

      {/* Metadata + report actions — stacked rows so the moderation
          pills never wrap awkwardly next to the posted date. */}
      <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Posted {reportDate}
          </span>

          <span
            className="font-mono text-[11px] text-slate-300"
            title={`Report ID: ${item.id}`}
          >
            {item.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReportFlagButton itemType={itemType} itemId={item.id} />

          {item.reporterId && <UserReportButton targetUserId={item.reporterId} />}
        </div>
      </div>
    </div>
  );
}
