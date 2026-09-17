import { createServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { FileWarning, ShieldCheck } from "lucide-react";
import { isAdminUser } from "@/lib/actions/admin";
import { reviewIdVerificationAction } from "@/lib/actions/verification";

export const dynamic = "force-dynamic";

const DOC_LABELS: Record<string, string> = {
  philsys: "PhilSys National ID",
  drivers_license: "Driver's License",
  passport: "Passport",
  umid: "UMID",
  voters_id: "Voter's ID",
};

export default async function AdminVerificationsPage() {
  if (!(await isAdminUser())) notFound();

  // Review queue and document access go through the service role: the
  // identity_verifications RLS only exposes a user's OWN rows, and the
  // id-documents bucket has no admin policy by design (no standing read
  // access outside deliberate service-role use).
  const service = createServiceRoleClient();

  const { data: pending } = await service
    .from("identity_verifications")
    .select("*, profiles!inner(username, first_name, last_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: decided } = await service
    .from("identity_verifications")
    .select("*, profiles!inner(username, first_name, last_name)")
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(20);

  // Short-lived signed URLs (10 min) for admins only — never public links.
  const docUrls = await Promise.all(
    (pending ?? []).map(async (row) => {
      const { data } = await service.storage
        .from("id-documents")
        .createSignedUrl(row.storage_path, 600);
      return data?.signedUrl ?? null;
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">
        ID verifications
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Members who volunteered a government ID. Compare the photo to the
        name they use on FindBack PH, approve carefully — this grants the
        gold seal. Documents are private; your links expire in 10 minutes.
      </p>

      <div className="mt-6 space-y-4">
        {(pending ?? []).length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No pending ID reviews. 🎉
          </p>
        )}
        {(pending ?? []).map((row, i) => {
          const p = row.profiles as unknown as {
            username: string;
            first_name: string;
            last_name: string;
          };
          return (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">
                    {p.first_name} {p.last_name}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      @{p.username}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {DOC_LABELS[row.doc_type] ?? row.doc_type} · submitted{" "}
                    {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                  Pending
                </span>
              </div>

              {docUrls[i] ? (
                <a
                  href={docUrls[i]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-electric-700 hover:underline"
                >
                  <ShieldCheck size={14} />
                  Open ID document (expires in 10 min)
                </a>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
                  <FileWarning size={13} />
                  Document missing from storage — reject with reason.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <form
                  action={async () => {
                    "use server";
                    await reviewIdVerificationAction(row.id, "approved");
                  }}
                >
                  <button type="submit" className="btn-primary !py-2 text-xs">
                    Approve
                  </button>
                </form>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await reviewIdVerificationAction(
                      row.id,
                      "rejected",
                      formData.get("reason")?.toString() ?? ""
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="reason"
                    placeholder="Rejection reason (shown to member)"
                    required
                    className="input !py-2 text-xs sm:w-72"
                  />
                  <button
                    type="submit"
                    className="btn-ghost !py-2 text-xs !text-red-600"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {(decided ?? []).length > 0 && (
        <>
          <h2 className="mt-10 font-display text-lg font-semibold text-navy-900">
            Recently reviewed
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                {(decided ?? []).map((row) => {
                  const p = row.profiles as unknown as {
                    username: string;
                    first_name: string;
                    last_name: string;
                  };
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5">
                        <Link href={`/member/${p.username}`} className="font-medium text-navy-900 hover:underline">
                          {p.first_name} {p.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {DOC_LABELS[row.doc_type] ?? row.doc_type}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            row.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">
                        {row.reviewed_at
                          ? format(new Date(row.reviewed_at), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
