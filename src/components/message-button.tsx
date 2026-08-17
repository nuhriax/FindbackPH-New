"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/lib/actions/messaging";
import { MessageSquare } from "lucide-react";

export function MessageButton({
  itemType,
  itemId,
  isOwner,
  label = "Message",
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  isOwner?: boolean;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isOwner) {
    return null;
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getOrCreateConversation(itemType, itemId);

      if ("error" in result) {
        if (result.error === "You must be signed in to message") {
          router.push("/login");
          return;
        }
        setError(result.error);
        return;
      }

      router.push(`/messages/${result.id}`);
    });
  }

  return (
    <div>
      <button className="btn-primary w-full" disabled={isPending} onClick={handleClick}>
        <MessageSquare size={16} />
        {isPending ? "Opening…" : label}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
