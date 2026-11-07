import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Method={id:string;method_code:string;display_name:string;instructions:Record<string,string>;is_enabled:boolean};
type Order={id:string;user_id:string;amount:number;currency:string;status:string;payment_method:string|null;provider:string;provider_reference:string|null;created_at:string};

export function PremiumPaymentsAdmin(){
 const qc=useQueryClient(); const [draft,setDraft]=useState<Record<string,string>>({});
 const q=useQuery({queryKey:["admin","premium-payments"],queryFn:async()=>{
  const db=supabase as any; const {data:auth}=await supabase.auth.getUser(); if(!auth.user) return {principal:false,methods:[],orders:[]};
  const {data:c,error:ce}=await db.from("platform_control").select("principal_admin_id").eq("id",true).maybeSingle(); if(ce) throw ce;
  if(c?.principal_admin_id!==auth.user.id) return {principal:false,methods:[],orders:[]};
  const [{data:methods,error:me},{data:orders,error:oe}]=await Promise.all([
   db.from("platform_payment_methods").select("id,method_code,display_name,instructions,is_enabled").order("display_name"),
   db.from("billing_payment_orders").select("id,user_id,amount,currency,status,payment_method,provider,provider_reference,created_at").eq("item_code","premium_monthly").order("created_at",{ascending:false}).limit(100)
  ]); if(me) throw me; if(oe) throw oe; return {principal:true,methods:(methods||[]) as Method[],orders:(orders||[]) as Order[]};
 }});
 async function save(m:Method,enabled:boolean){
  const raw=draft[m.id]??Object.entries(m.instructions||{}).map(([k,v])=>k+": "+v).join("\n");
  const instructions:Record<string,string>={};
  raw.split("\n").map(x=>x.trim()).filter(Boolean).forEach(line=>{const i=line.indexOf(":");if(i>0) instructions[line.slice(0,i).trim()]=line.slice(i+1).trim();});
  const {error}=await (supabase as any).from("platform_payment_methods").update({instructions,is_enabled:enabled,updated_by:(await supabase.auth.getUser()).data.user?.id}).eq("id",m.id);
  if(error) toast.error(error.message); else {toast.success("Método actualizado.");qc.invalidateQueries({queryKey:["admin","premium-payments"]});}
 }
 async function confirm(order:Order){
  if(!confirm("Confirmaste no banco que recebeste 5.000 Kz deste pedido?")) return;
  const {error}=await (supabase as any).rpc("confirm_manual_premium_payment",{p_payment_order_id:order.id});
  if(error) toast.error(error.message); else {toast.success("Pagamento confirmado. O Premium foi activado automaticamente por 30 dias.");qc.invalidateQueries({queryKey:["admin","premium-payments"]});}
 }
 if(q.isLoading) return <div className="mt-4 h-32 animate-pulse rounded-xl bg-secondary"/>;
 if(q.error) return <p className="mt-4 text-sm text-destructive">Erro: {(q.error as Error).message}</p>;
 if(!q.data?.principal) return <p className="mt-4 rounded-xl border p-4 text-sm">Área reservada ao administrador principal.</p>;
 return <div className="mt-4 space-y-5">
  <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Métodos de recebimento</h2><p className="mt-1 text-sm text-muted-foreground">Insere apenas instruções públicas de pagamento. Nunca guardes PIN, palavra-passe ou códigos secretos nesta área.</p>
   <div className="mt-4 space-y-4">{q.data.methods.map(m=><MethodEditor key={m.id} method={m} value={draft[m.id]??Object.entries(m.instructions||{}).map(([k,v])=>k+": "+v).join("\n")} onChange={v=>setDraft(d=>({...d,[m.id]:v}))} onSave={enabled=>save(m,enabled)}/>)}</div>
  </section>
  <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Pedidos Premium</h2><p className="mt-1 text-xs text-muted-foreground">Só confirma manualmente transferências depois de veres o crédito na conta comercial. Pagamentos de gateway serão confirmados pelo webhook.</p>
   <div className="mt-3 space-y-3">{q.data.orders.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"><div><p className="text-sm font-medium">{new Intl.NumberFormat("pt-AO").format(Number(o.amount))} Kz · {o.payment_method||"—"}</p><p className="text-xs text-muted-foreground">Utilizador {o.user_id.slice(0,8)} · {new Date(o.created_at).toLocaleString("pt-AO")}</p></div><div className="flex items-center gap-2"><Badge variant={o.status==="paid"?"default":"secondary"}>{o.status}</Badge>{o.status==="pending"&&o.provider==="manual"&&<Button size="sm" onClick={()=>confirm(o)}>Confirmar recebimento</Button>}</div></div>)}{!q.data.orders.length&&<p className="text-sm text-muted-foreground">Sem pedidos.</p>}</div>
  </section>
 </div>;
}
function MethodEditor({method,value,onChange,onSave}:{method:Method;value:string;onChange:(v:string)=>void;onSave:(enabled:boolean)=>void}){
 const [enabled,setEnabled]=useState(method.is_enabled);
 return <div className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">{method.display_name}</div><Badge variant={enabled?"default":"secondary"}>{enabled?"Activo":"Desactivado"}</Badge></div>
  <p className="mt-1 text-xs text-muted-foreground">Uma linha por campo, no formato Nome: valor. Ex.: IBAN: AO06…</p>
  <Textarea className="mt-2" rows={4} value={value} onChange={e=>onChange(e.target.value)} placeholder="Telefone: …\nTitular: …\nInstruções: …"/>
  <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>setEnabled(v=>!v)}>{enabled?"Desactivar":"Activar"}</Button><Button size="sm" onClick={()=>onSave(enabled)}>Guardar configuração</Button></div>
 </div>;
}
