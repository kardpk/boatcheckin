import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Require authenticated operator — CRITICAL 1 fix (Next.js 15 async cookies)
 * Use in Server Components and Server Actions for dashboard routes.
 */
export async function requireOperator() {
  const cookieStore = await cookies(); // MUST await in Next.js 15+
  const headersList = await headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect to login with next param so operator returns here after login
  const pathname = headersList.get('x-invoke-path') ?? '/dashboard';
  const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;

  if (error || !user) redirect(loginUrl);

  const { data: operator } = await supabase
    .from("operators")
    .select(
      "id, full_name, email, company_name, subscription_status, subscription_tier, is_active, max_boats, trial_ends_at"
    )
    .eq("id", user.id)
    .single();

  if (!operator?.is_active) redirect(`/login?error=account_inactive&next=${encodeURIComponent(pathname)}`);

  return { user, operator, supabase };
}

