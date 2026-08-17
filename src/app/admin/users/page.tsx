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

  const supabase = createClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-white">Users</h1>
          <Link href="/admin" className="btn-ghost">
            Back
          </Link>
        </div>

        {!users || users.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <p className="text-slate-400">No users found.</p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {users.map((user: any) => (
                  <tr key={user.id} className="text-slate-300">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        @{user.username}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3">
                      {user.is_suspended ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
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
                            user.is_suspended ? "!text-emerald-300" : "!text-amber-300"
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
        )}
      </div>
    </div>
  );
}