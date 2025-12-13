import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitizeString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return value ?? null;
};

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, "."));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método não suportado" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookToken = Deno.env.get("LEAD_WEBHOOK_TOKEN");

  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase service credentials are missing");
    return jsonResponse(500, { error: "Infraestrutura não configurada" });
  }

  if (!webhookToken) {
    console.error("LEAD_WEBHOOK_TOKEN is not configured");
    return jsonResponse(500, { error: "Token do webhook ausente" });
  }

  const providedToken =
    req.headers.get("x-esc-webhook-token")?.trim() ||
    req.headers.get("authorization")?.replace("Bearer", "").trim();

  if (!providedToken || providedToken !== webhookToken) {
    return jsonResponse(401, { error: "Token inválido" });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse(400, { error: "JSON inválido" });
  }

  const ownerUserId = sanitizeString(payload?.owner_user_id);
  const name = sanitizeString(payload?.name);

  if (!ownerUserId || !name) {
    return jsonResponse(400, {
      error: "Campos obrigatórios ausentes",
      required: ["owner_user_id", "name"],
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const now = new Date().toISOString();
  const userId = sanitizeString(payload?.user_id) || ownerUserId;
  const assignedTo = sanitizeString(payload?.assigned_to);

  const leadInsert = {
    name,
    email: sanitizeString(payload?.email),
    phone: sanitizeString(payload?.phone),
    company: sanitizeString(payload?.company),
    position: sanitizeString(payload?.position),
    source: sanitizeString(payload?.source) || "chat_http_request",
    source_details: sanitizeString(payload?.source_details || payload?.channel),
    pipeline_stage_id: sanitizeString(payload?.pipeline_stage_id),
    assigned_to: assignedTo,
    status: sanitizeString(payload?.status) || "active",
    notes: sanitizeString(payload?.notes || payload?.message),
    owner_user_id: ownerUserId,
    user_id: userId,
    created_by: sanitizeString(payload?.created_by) || ownerUserId,
    expected_value: parseNumber(payload?.expected_value),
    probability: parseNumber(payload?.probability),
    expected_close_date: sanitizeString(payload?.expected_close_date),
    first_contact_date: sanitizeString(payload?.first_contact_date) || now,
    last_contact_date: sanitizeString(payload?.last_contact_date) || now,
    last_activity_date: now,
  };

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .insert([leadInsert])
    .select()
    .single();

  if (leadError) {
    console.error("Failed to insert lead", leadError.message);
    return jsonResponse(500, {
      error: "Erro ao registrar lead",
      details: leadError.message,
    });
  }

  const activityPayload = payload?.activity || {};
  const hasActivityContent =
    Boolean(activityPayload?.title) ||
    Boolean(activityPayload?.description) ||
    Boolean(payload?.message);

  if (hasActivityContent) {
    try {
      await supabaseAdmin.from("lead_activities").insert([
        {
          lead_id: lead.id,
          user_id:
            sanitizeString(activityPayload?.user_id) || assignedTo || userId,
          activity_type:
            sanitizeString(activityPayload?.type) || "chat_inbound",
          title:
            sanitizeString(activityPayload?.title) ||
            "Contato recebido pelo chat",
          description:
            sanitizeString(activityPayload?.description) ||
            sanitizeString(payload?.message),
          scheduled_at: sanitizeString(activityPayload?.scheduled_at),
          duration_minutes: activityPayload?.duration_minutes ?? null,
        },
      ]);
    } catch (activityError) {
      console.error("Failed to create lead activity", activityError);
    }
  }

  return jsonResponse(201, {
    success: true,
    lead_id: lead.id,
    assigned_to: lead.assigned_to,
    status: lead.status,
  });
});
