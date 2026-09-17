import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users as UsersIcon } from "lucide-react";
import {
  setUserSuspensionAction,
  logAdminAction,
  isAdminUser,
} from "@/lib/actions/admin";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-navy-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage community members, suspensions, and account status.
        </p>
      </div>

      {!users || users.length === 0 ? (
        <div className="card p-10 text-center">
          <UsersIcon size={28} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold text-navy-900">No users found</p>
          <p className="mt-1 text-sm text-slate-500">New members will appear here as they sign up.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {users.length} member{users.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-slate-400">
              {(users.filter((u: any) => u.is_suspended).length > 0) &&
                `${users.filter((u: any) => u.is_suspended).length} suspended`}
            </p>
          </div>
          {/* Scrollable on narrow screens; min-width keeps columns readable
              while the page itself never overflows at 320px. */}
          <div className="admin-table-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ice-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user: any) => {
                  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed member";
                  const initial = (user.first_name?.[0] ?? "U").toUpperCase();
                  const email = user.email ?? "";
                  const atIndex = email.indexOf("@");
                  const maskedEmail =
                    atIndex > 0
                      ? `${email.slice(0, 2)}${"*".repeat(Math.min(8, Math.max(3, atIndex - 2)))}${email.slice(atIndex)}`
                      : "—";
                  return (
                    <tr key={user.id} className="text-slate-600 hover:bg-electric-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-electric-200 bg-electric-50 text-sm font-bold text-electric-700"
                          >
                            {initial}
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-navy-900">{name}</span>
                            <span className="block truncate text-xs text-slate-500">{maskedEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.role === "admin" || user.role === "moderator"
                              ? "bg-electric-50 text-electric-700 ring-1 ring-electric-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {user.role === "admin" || user.role === "moderator" ? "Staff" : "Member"}
                          <span className="font-normal text-slate-400">· {user.role}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_suspended ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form
                          action={async () => {
                            "use server";
                            await setUserSuspensionAction(user.id, !user.is_suspended);
                            await logAdminAction(
                              user.is_suspended ? "restore_user" : "suspend_user",
                              "user",
                              user.id
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              user.is_suspended
                                ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                                : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            {user.is_suspended ? "Restore" : "Suspend"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}