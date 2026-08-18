"use client";

import { useEffect } from "react";
import { useSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CallbackPage() {
  useEffect(() => {
    const supa = useSupabaseClient();

    // Check if the user has confirmed their email by attempting to get session
    // If the session exists and user is confirmed, we can proceed
    supa.auth.getSession().then(({ data, error }) => {
      if (data.session && !error) {
        // User has a session - check if email is confirmed
        // If not confirmed, redirect back to login with a message
        // If confirmed, redirect to dashboard
        const { user } = data.session;
        if (user) {
          // Check user metadata or try to access profiles
          // For now, just redirect to dashboard - the session should work
          // if the email was already confirmed or if we're allowing auto-login
          window.location.href = "/dashboard";
        }
      } else {
        // No session or error - redirect to login
        window.location.href = "/login";
      }
    });
  }, []);

  return null;
}