import { AuthExperience } from "@/components/auth/auth-experience";

/**
 * Route-group layout for /login and /register. Persists across navigation
 * between the two, so the animated visual and theme stay continuous while only
 * the form content swaps.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthExperience>{children}</AuthExperience>;
}