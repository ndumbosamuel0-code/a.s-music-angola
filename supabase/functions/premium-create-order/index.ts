import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Backend billing is not configured." }, 503);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return reply({ error: "Authentication required." }, 401);

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } });
  const { data: auth, error: authError } = await authClient.auth.getUser();
  if (authError || !auth.user) return reply({ error: "Invalid session." }, 401);

  let body: { payment_method?: string };
  try { body = await req.json(); } catch { return reply({ error: "Invalid JSON." }, 400); }
  const methodMap: Record<string,string> = {
    multicaixa_express: "multicaixa_express",
    payment_reference: "reference",
    reference: "reference",
    unitel_money: "unitel_money",
    bank_transfer: "bank_transfer",
  };
  const method = methodMap[body.payment_method || ""];
  if (!method) return reply({ error: "Unsupported payment method." }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: catalog, error: catalogError } = await admin.from("billing_catalog")
    .select("id,item_code,amount,currency,is_active").eq("item_code","premium_monthly").single();
  if (catalogError || !catalog || Number(catalog.amount) !== 5000 || catalog.currency !== "AOA" || !catalog.is_active) {
    return reply({ error: "The Premium product is not ready for checkout." }, 409);
  }
  const methodCode = body.payment_method === "reference" ? "payment_reference" : body.payment_method;
  const { data: configured, error: methodError } = await admin.from("platform_payment_methods")
    .select("id,is_enabled,instructions").eq("method_code",methodCode).single();
  if (methodError || !configured?.is_enabled) return reply({ error: "This payment method is not enabled yet." }, 409);

  // Until the AppyPay merchant contract and API credentials are installed, orders are
  // deliberately created as manual-review orders. No client-side proof can mark them paid.
  const { data: order, error: orderError } = await admin.from("billing_payment_orders").insert({
    user_id: auth.user.id, catalog_item_id: catalog.id, item_type: "premium_monthly",
    item_code: "premium_monthly", amount: 5000, currency: "AOA", status: "pending",
    payment_method: method, provider: "manual", metadata: { method_code: methodCode, verification: "manual_review" },
  }).select("id").single();
  if (orderError || !order) return reply({ error: orderError?.message || "Could not create order." }, 500);

  return reply({ order_id: order.id, amount: 5000, currency: "AOA", verification: "manual_review", instructions: configured.instructions });
});
