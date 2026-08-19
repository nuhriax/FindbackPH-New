"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * OAuth / email-confirmation callback. Checks the session after Supabase
 * redirects back to this route and routes the user to the right place.
 */
export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (data.session && !error) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}