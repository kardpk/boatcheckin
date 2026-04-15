import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Require authenticated operator — uses service client for operator lookup
 * to avoid RLS issues with cookie-based sessions in Server Components.
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
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
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

  // Use service client (bypasses RLS) for operator lookup.
  // The anon-key client's RLS policy (auth.uid() = id) can fail in Server Components
  // because the cookie-based session isn't always recognized during redirects.
  // Using SELECT * to be resilient to missing columns from unapplied migrations.
  const serviceClient = createServiceClient();

  let { data: operator } = await serviceClient
    .from("operators")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!operator) {
    // Self-heal ghost accounts: auth created, but operator row missing
    const { error: healError } = await serviceClient.from("operators").insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || "Operator",
      company_name: user.user_metadata?.company_name || null,
      is_active: true,
      subscription_status: "trial",
      subscription_tier: "solo",
      max_boats: 1,
    });
    
    if (healError) {
      // Duplicate key = row already exists (race condition); re-fetch
      if (healError.code === '23505') {
        const { data: existing } = await serviceClient
          .from("operators")
          .select("*")
          .eq("id", user.id)
          .single();
        operator = existing;
      } else {
        console.error("[AUTH_HEAL_ERROR]", healError);
        redirect(`/login?error=account_inactive`);
      }
    } else {
      // Fetch newly created operator
      const { data: healed } = await serviceClient
        .from("operators")
        .select("*")
        .eq("id", user.id)
        .single();
      operator = healed;
    }
  }

  if (!operator?.is_active) redirect(`/login?error=account_inactive&next=${encodeURIComponent(pathname)}`);

  return { user, operator, supabase };
}

// ─── Admin guard ──────────────────────────────────────────────────────────────

export type AdminRole = 'founder' | 'admin' | 'member' | 'support'

const ROLE_RANK: Record<AdminRole, number> = {
  founder: 4,
  admin: 3,
  member: 2,
  support: 1,
}

/**
 * Require an admin role on the operator. Redirects to /dashboard if the
 * operator doesn't have a sufficient admin_role.
 *
 * @param minRole - Minimum role required (default: 'member')
 *   - 'member'  → any admin role can access
 *   - 'admin'   → admin + founder only
 *   - 'founder' → founder only
 */
export async function requireAdmin(minRole: AdminRole = 'member') {
  const { user, operator, supabase } = await requireOperator()

  const userRole = (operator.admin_role as AdminRole) ?? null
  const userRank = userRole ? (ROLE_RANK[userRole] ?? 0) : 0
  const requiredRank = ROLE_RANK[minRole] ?? 0

  if (userRank < requiredRank) {
    redirect('/dashboard')
  }

  return { user, operator, supabase, adminRole: userRole! }
}
