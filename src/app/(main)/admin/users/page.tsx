import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
          <p className="font-display text-lg font-semibold text-navy-900">No users found</p>
        </div>
      ) : (
          <div className="mt-8 card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ice-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user: any) => (
                  <tr key={user.id} className="text-slate-600 hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-navy-900">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {user.email ? `${user.email.slice(0, 2)}${"*".repeat(Math.min(8, Math.max(3, user.email.indexOf("@") - 2)))}@${user.email.split("@")[1] || ""}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
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
                    <td className="px-4 py-3">
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
                          className={`btn-ghost !py-1.5 text-xs ${
                            user.is_suspended ? "!text-emerald-700" : "!text-amber-700"
                          }`}
                        >
                          {user.is_suspended ? "Restore" : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
    </div>
  );
}