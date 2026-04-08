"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { auditLog } from "@/lib/security/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  companyName: z.string().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function signupAction(
  formData: FormData
): Promise<{ error: string; field?: string } | undefined> {
  const raw = {
    fullName: formData.get("fullName") as string,
    companyName: (formData.get("companyName") as string) || undefined,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const fieldName = first?.path[0];
    return {
      error: first?.message ?? "Invalid input",
      ...(typeof fieldName === "string" ? { field: fieldName } : {}),
    };
  }

  const { fullName, companyName, email, password } = parsed.data;
  const supabase = await createClient();

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
      },
    },
  });

  if (authError) {
    // Handle specific Supabase errors
    if (
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("already been registered")
    ) {
      return {
        error: "An account with this email already exists.",
        field: "email",
      };
    }
    if (authError.message.toLowerCase().includes("password")) {
      return {
        error: "Password must be at least 8 characters.",
        field: "password",
      };
    }
    return { error: "Something went wrong. Please try again." };
  }

  const user = authData.user;
  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  // Insert operator record bypassing RLS (session may not be active yet)
  const serviceClient = createServiceClient();
  const { error: insertError } = await serviceClient.from("operators").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    company_name: companyName ?? null,
    subscription_tier: "solo",
    subscription_status: "trial",
    max_boats: 1,
    is_active: true,
  });

  if (insertError) {
    console.error("[signup] operator insert failed:", insertError.message);
    // Don't fail the signup — the auth account exists
    // Operator row will be created on next login if missing
  }

  // Audit log
  auditLog({
    action: "operator_login", // closest match in AuditAction type
    operatorId: user.id,
    actorType: "operator",
    actorIdentifier: user.id,
    entityType: "operator",
    entityId: user.id,
  });

  // Return undefined = success (client will redirect)
  return undefined;
}
