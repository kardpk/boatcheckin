"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Firma workspace for an operator.
 * Usually invoked once when the operator signs up or first configures their digital waivers.
 */
export async function provisionOperatorFirmaWorkspace(operatorId: string, companyName: string) {
  try {
    const apiKey = process.env.FIRMA_API_KEY;
    if (!apiKey) throw new Error("Missing global Firma API key");

    // 1. Call Firma API to create a workspace
    const res = await fetch("https://api.firma.dev/functions/v1/signing-request-api/workspaces", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: companyName }),
    });

    if (!res.ok) {
      throw new Error("Failed to create Firma Workspace");
    }

    const { id: workspaceId } = await res.json();

    // 2. Save it to the Operator table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("operators")
      .update({ firma_workspace_id: workspaceId })
      .eq("id", operatorId);

    if (error) throw error;

    return { success: true, workspaceId };
  } catch (error) {
    console.error("[Firma Ops] Workspace generation error:", error);
    return { success: false, error: "Failed to provision workspace." };
  }
}

/**
 * Fetches the specific Operator's active workspace credentials or generated JWT
 * to load the Firma Embedded Template Editor UI securely.
 */
export async function generateTemplateEditorJwt(operatorId: string) {
   // In a real implementation this creates the short-lived JWT for the Embedded editor
   // For now, it represents the interface the dashboard will use.
   return { success: true, token: "DUMMY_JWT_FOR_TEMPLATE_EDITOR_IFRAME", operatorId };
}
