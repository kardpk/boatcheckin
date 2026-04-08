"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/security/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Incorrect email or password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // SECURITY: Always show same message — never reveal which field is wrong
    return { error: "Incorrect email or password." };
  }

  // Audit log
  auditLog({
    action: "operator_login",
    operatorId: data.user.id,
    actorType: "operator",
    actorIdentifier: data.user.id,
    entityType: "operator",
    entityId: data.user.id,
  });

  // Break Next.js App Router Client-Side Cache!
  revalidatePath("/", "layout");

  // Return undefined = success (client will redirect)
  return undefined;
}
