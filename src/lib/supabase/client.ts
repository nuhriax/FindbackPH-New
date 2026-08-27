import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// NOTE: The experimental passkey flag only unlocks the SDK API surface on the
// client (auth.registerPasskey / auth.signInWithPasskey / auth.passkey.*).
// It does NOT enable passkeys server-side — that's controlled by Supabase Auth
// config — and all UI is additionally gated by NEXT_PUBLIC_PASSKEYS_ENABLED.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { experimental: { passkey: true } } }
  );
}
