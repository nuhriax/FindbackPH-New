import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserConversations, type ConversationData } from "@/lib/actions/messaging";
import { MessageCircle, PackageX, PackageCheck } from "lucide-react";

export async function ConversationsList() {
  let conversations: ConversationData[] = [];
  try {
    conversations = (await getUserConversations()) as ConversationData[];
  } catch (err) {
    console.error("[messages] getUserConversations failed:", err);
  }

  let supabaseUser: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    supabaseUser = user;
  } catch (err) {
    console.error("[messages] auth check failed:", err);
  }

  // Enrich each conversation (profile, item title, last message) defensively —
  // a single broken lookup (deleted profile, deleted item, missing column)
  // must never take down the whole inbox page.
  const enriched = await Promise.all(
    conversations.map(async (convo) => {
      try {
        const supabase = await createClient();
        const otherId =
          convo.participant_a === supabaseUser?.id
            ? convo.participant_b
            : convo.participant_a;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, first_name, last_name, avatar_url")
          .eq("id", otherId)
          .maybeSingle();

        const itemTable =
          convo.item_type === "lost_item" ? "lost_items" : "found_items";
        const { data: item } = await supabase
          .from(itemTable)
          .select("title")
          .eq("id", convo.item_id)
          .maybeSingle();

        const lastMessage = (convo as any).messages?.[0];
        return {
          ...convo,
          otherParticipant: profile,
          lastMessage,
          itemTitle: item?.title ?? null,
        };
      } catch (err) {
        console.error("[messages] failed to enrich conversation:", err);
        return { ...convo, otherParticipant: null, lastMessage: null, itemTitle: null };
      }
    })
  );

  const user = supabaseUser;

  if (!user) redirect("/login");

  if (conversations.length === 0) {
    return (
      <div className="rounded-card border border-slate-200/70 bg-white/70 p-12 text-center shadow-soft backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
          <MessageCircle size={24} />
        </div>
        <h2 className="mt-5 font-display text-lg font-semibold text-navy-900">No conversations yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          When you message someone about a lost or found item, the conversation
          will show up here.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/lost" className="btn-secondary">
            <PackageX size={16} /> Browse lost items
          </Link>
          <Link href="/found" className="btn-secondary">
            <PackageCheck size={16} /> Browse found items
          </Link>
          <Link href="/search" className="btn-primary">
            Search reports
          </Link>
        </div>
      </div>
    );
  }

  const listInner = (
    <ul className="divide-y divide-slate-100">
      {enriched.map((convo) => {
        const other = convo.otherParticipant;
        const lastMsg = convo.lastMessage;
        const unreadCount =
          (convo as any).messages?.filter((m: any) => m.sender_id !== user.id && !m.read_by_receiver).length ?? 0;
        const isUnread = unreadCount > 0;
        const displayName =
          other?.first_name
            ? `${other.first_name} ${other.last_name ?? ""}`.trim()
            : other?.username ?? "Someone";
        const initial =
          other?.first_name?.[0]?.toUpperCase() ?? other?.username?.[0]?.toUpperCase() ?? "U";

        let timeLabel = "";
        if (lastMsg?.created_at) {
          const d = new Date(lastMsg.created_at);
          if (!Number.isNaN(d.getTime())) {
            const raw = formatDistanceToNow(d, { addSuffix: false });
            timeLabel =
              raw === "less than a minute"
                ? "now"
                : raw
                    .replace(/^about /, "")
                    .replace(/^(\d+)\s+minutes?$/, "$1m")
                    .replace(/^(\d+)\s+hours?$/, "$1h")
                    .replace(/^(\d+)\s+days?$/, "$1d");
          }
        }

        return (
          <li key={convo.id}>
            <Link
              href={`/messages/${convo.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors sm:px-5 ${
                isUnread
                  ? "bg-electric-50/30 hover:bg-electric-50/60"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Avatar + online dot */}
              <span className="relative shrink-0">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-sm font-semibold text-white">
                  {other?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
                />
              </span>

              {/* Name · preview */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm ${isUnread ? "font-bold" : "font-semibold"} text-navy-900`}>
                    {displayName}
                  </span>
                  {timeLabel && (
                    <span className={`ml-auto shrink-0 text-[11px] ${isUnread ? "font-semibold text-electric-600" : "text-slate-400"}`}>
                      {timeLabel}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className={`min-w-0 flex-1 truncate text-sm ${isUnread ? "font-semibold text-navy-900" : "text-slate-500"}`}>
                    {lastMsg
                      ? `${lastMsg.sender_id === user.id ? "You: " : ""}${
                          (lastMsg as any).kind === "audio" ? "🎤 Voice message" : lastMsg.body
                        }`
                      : convo.itemTitle
                        ? `About ${convo.itemTitle}`
                        : "Say hello — no messages yet"}
                  </p>
                  {isUnread && (
                    <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-electric-500" aria-label={`${unreadCount} unread`} />
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="overflow-hidden rounded-card border border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-md">
      {listInner}
    </div>
  );
}