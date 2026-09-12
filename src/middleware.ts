import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/report", "/messages", "/settings", "/admin", "/member"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // A stale/expired session or a flaky Supabase round-trip must never 500 the
  // whole site — degrade to "treated as signed out" instead of throwing.
  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] = null;
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch (error) {
    console.error("[middleware] getUser failed — continuing signed-out:", error);
  }

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (false && isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Onboarding gate — Google/Facebook sign-ups have no real name yet, so they
  // must complete the "Almost there" step before using ANY part of the site,
  // not just the dashboard. Rules that keep this safe:
  //   • GET navigations only — a redirect on POST would swallow server actions
  //     (e.g. logging out from the complete-profile page itself).
  //   • Auth pages (/complete-profile, /auth callback, /login, /register) are
  //     exempt so the gate can never loop back onto itself.
  //   • Only fires when the profile row EXISTS and is missing names, matching
  //     the dashboard gate — a not-yet-created row never traps a new user.
  const AUTH_PAGES = ["/complete-profile", "/auth", "/login", "/register"];
  if (
    user &&
    request.method === "GET" &&
    !AUTH_PAGES.some((p) => path.startsWith(p))
  ) {
    let onboardingProfile: { first_name: string | null; last_name: string | null } | null =
      null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();
      onboardingProfile = data;
    } catch (error) {
      // A failed lookup must never trap a signed-in user — let them through.
      console.error("[middleware] onboarding profile lookup failed:", error);
    }

    if (
      onboardingProfile &&
      (!onboardingProfile.first_name?.trim() || !onboardingProfile.last_name?.trim())
    ) {
      return NextResponse.redirect(new URL("/complete-profile", request.url));
    }
  }

  // Server-side gate on /admin — actual role check happens again in the page itself
  // and in every admin server action, since middleware alone must never be trusted
  // as the sole authorization boundary.
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

