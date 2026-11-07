import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error:"Method not allowed" },405);
  const url=Deno.env.get("SUPABASE_URL");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token=Deno.env.get("APPYPAY_ACCESS_TOKEN");
  const apiBase=(Deno.env.get("APPYPAY_API_BASE") || "https://gwy-api-tst.appypay.co.ao/v2.0").replace(/\/$/,"");
  if(!url||!serviceKey||!token) return json({error:"Payment provider is not configured."},503);

  let event:any;
  try { event=await req.json(); } catch { return json({error:"Invalid payload."},400); }
  const chargeId=String(event?.id || "");
  const merchantTransactionId=String(event?.merchantTransactionId || "");
  if(!chargeId || !merchantTransactionId) return json({error:"Missing charge identifiers."},400);

  // AppyPay recommends a server-to-server GET /charges/{id} before trusting a callback.
  const verified=await fetch(`${apiBase}/charges/${encodeURIComponent(chargeId)}`,{
    headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}
  });
  if(!verified.ok) return json({error:"Could not verify charge with AppyPay."},502);
  const charge:any=await verified.json();
  const status=String(charge?.responseStatus?.status || "").toLowerCase();
  const amount=Number(charge?.amount);
  const currency=String(charge?.currency || "");
  const tx=String(charge?.merchantTransactionId || "");
  if(status!=="success" || amount!==5000 || currency!=="AOA" || tx!==merchantTransactionId) {
    return json({received:true,processed:false,reason:"Charge not verified as exact 5,000 AOA Premium payment."});
  }

  const db=createClient(url,serviceKey,{auth:{persistSession:false}});
  const {data:order,error}=await db.from("billing_payment_orders").select("id,status,amount,currency,item_code,provider_order_id")
    .eq("provider","appy_pay").eq("provider_order_id",chargeId).maybeSingle();
  if(error) return json({error:"Could not locate payment order."},500);
  if(!order || order.item_code!=="premium_monthly" || Number(order.amount)!==5000 || order.currency!=="AOA") {
    return json({error:"No matching Premium order."},404);
  }
  if(order.status==="paid") return json({received:true,processed:true,duplicate:true});
  const {error:updateError}=await db.from("billing_payment_orders").update({status:"paid",paid_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    .eq("id",order.id).eq("status","pending");
  if(updateError) return json({error:"Could not update verified order."},500);
  return json({received:true,processed:true});
});
