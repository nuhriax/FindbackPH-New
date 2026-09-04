"use client";

/**
 * Global incoming-call listener.
 *
 * Mounted once in the (main) layout: subscribes to the signed-in user's
 * signaling channel (`call:u:<userId>`) so an incoming voice/video call rings
 * ANYWHERE in the app — not only inside the chat thread. When an offer
 * arrives it mounts <CallOverlay> in "answer" mode.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CallOverlay, type IncomingOffer } from "@/components/messaging/call-overlay";

export function IncomingCallManager() {
  const supabase = useMemoClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [offer, setOffer] = useState<IncomingOffer | null>(null);

  // Resolve the signed-in user once.
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Listen for call offers on our personal channel.
  useEffect(() => {
    if (!userId || offer) return;

    const channel = supabase
      .channel(`call:u:${userId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "call-offer" }, ({ payload }) => {
        const p = payload as IncomingOffer;
        if (p.from === userId || !p.sdp) return;
        setOffer(p);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, offer, supabase]);

  if (!userId || !offer) return null;

  return (
    <CallOverlay
      key={`incoming-${offer.from}-${offer.sdp.sdp?.slice(0, 32) ?? ""}`}
      conversationId="" // filled by the action layer; callee's log is written by the caller
      currentUserId={userId}
      calleeId={userId}
      displayName={offer.callerName ?? "Incoming call"}
      avatarUrl={offer.callerAvatar ?? null}
      requestedMode={null}
      incomingOffer={offer}
      onClosed={() => setOffer(null)}
    />
  );
}

function useMemoClient() {
  const [ref] = useState(() => ({ current: null as ReturnType<typeof createClient> | null }));
  if (!ref.current) ref.current = createClient();
  return ref.current;
}
