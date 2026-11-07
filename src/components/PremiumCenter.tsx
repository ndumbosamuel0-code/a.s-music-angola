import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crown, MessageCircle, Paperclip, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Method = { id: string; method_code: string; display_name: string; instructions: Record<string,string>; is_enabled: boolean };
type Order = { id: string; amount: number; currency: string; status: string; payment_method: string | null; provider_reference: string | null; created_at: string };
type Thread = { id: string; payment_order_id: string | null; payment_status: string; created_at: string };
type Message = { id: string; sender_id: string; body: string | null; attachment_path: string | null; message_type: string; created_at: string };

const methodLabels: Record<string,string> = { multicaixa_express: "Multicaixa Express", bank_transfer: "Transferência bancária", reference: "Pagamento por referência", unitel_money: "UNITEL Money" };
const statusLabels: Record<string,string> = { pending: "Pendente", verifying: "Em verificação", paid: "Pago", failed: "Falhou", expired: "Expirado", needs_review: "A aguardar revisão" };
const money = (n:number) => new Intl.NumberFormat("pt-AO").format(n) + " Kz";

export function PremiumCenter({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  const subscription = useQuery({
    queryKey: ["premium-subscription", userId],
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db.from("artist_premium_subscriptions").select("id,status,starts_at,ends_at")
        .eq("user_id", userId).eq("status","active").gt("ends_at", new Date().toISOString())
        .order("ends_at",{ascending:false}).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
  const methods = useQuery({
    queryKey: ["premium-payment-methods"],
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db.from("platform_payment_methods").select("id,method_code,display_name,instructions,is_enabled").eq("is_enabled",true).order("display_name");
      if (error) throw error;
      return (data ?? []) as Method[];
    },
  });
  const orders = useQuery({
    queryKey: ["premium-orders", userId],
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db.from("billing_payment_orders").select("id,amount,currency,status,payment_method,provider_reference,created_at")
        .eq("user_id",userId).eq("item_code","premium_monthly").order("created_at",{ascending:false}).limit(10);
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
  const threads = useQuery({
    queryKey: ["premium-threads", userId],
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db.from("billing_support_threads").select("id,payment_order_id,payment_status,created_at")
        .eq("user_id",userId).order("updated_at",{ascending:false});
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });
  const threadId = activeThread ?? threads.data?.[0]?.id ?? null;
  const messages = useQuery({
    queryKey: ["premium-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db.from("billing_support_messages").select("id,sender_id,body,attachment_path,message_type,created_at")
        .eq("thread_id",threadId).order("created_at");
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
  const selectedMethod = methods.data?.find(m => m.method_code === method);
  const expiry = subscription.data?.ends_at ? new Date(subscription.data.ends_at).toLocaleDateString("pt-AO") : null;

  async function createOrder() {
    if (!method) { toast.error("Escolhe um método de pagamento."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("premium-create-order", { body: { payment_method: method } });
      if (error) throw error;
      if (!data?.order_id) throw new Error(data?.error || "Não foi possível criar o pedido.");
      const db = supabase as any;
      const { data: thread, error: threadError } = await db.from("billing_support_threads").insert({
        user_id: userId, payment_order_id: data.order_id, subject: "Pagamento Premium", payment_status: "pending",
      }).select("id").single();
      if (threadError) throw threadError;
      setActiveThread(thread.id);
      toast.success("Pedido criado. Segue as instruções e envia o comprovativo no chat.");
      await Promise.all([qc.invalidateQueries({queryKey:["premium-orders",userId]}),qc.invalidateQueries({queryKey:["premium-threads",userId]})]);
    } catch (e) { toast.error((e as Error).message || "Erro ao criar pedido."); }
    finally { setBusy(false); }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!threadId || (!message.trim() && !file)) return;
    setBusy(true);
    try {
      let attachment_path: string | null = null;
      if (file) {
        if (!["image/jpeg","image/png","application/pdf"].includes(file.type) || file.size > 5*1024*1024) throw new Error("Anexo permitido: JPG, PNG ou PDF até 5 MB.");
        attachment_path = userId + "/" + crypto.randomUUID() + "-" + file.name.replace(/[^\w.-]/g,"_");
        const { error } = await supabase.storage.from("billing-proofs").upload(attachment_path,file,{contentType:file.type});
        if (error) throw error;
      }
      const db = supabase as any;
      const { error } = await db.from("billing_support_messages").insert({
        thread_id:threadId, sender_id:userId, body:message.trim() || null,
        attachment_path, message_type:file ? "payment_proof" : "message",
      });
      if (error) throw error;
      setMessage(""); setFile(null);
      await qc.invalidateQueries({queryKey:["premium-messages",threadId]});
      toast.success("Mensagem enviada.");
    } catch(e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function openAttachment(path:string) {
    const { data, error } = await supabase.storage.from("billing-proofs").createSignedUrl(path,300);
    if (error) toast.error("Não foi possível abrir o comprovativo.");
    else if (data?.signedUrl) window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  const active = !!subscription.data;
  return <div className="mt-4 space-y-5">
    <section className="overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-card via-card to-gold/10 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Badge className="mb-3 border-gold/30 bg-gold/10 text-gold"><Crown className="mr-1 h-3 w-3"/> A.S MUSIC PREMIUM</Badge>
          <h2 className="text-2xl font-bold">Mais destaque para a tua carreira.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Plano de 30 dias para artistas que querem acompanhar a sua actividade e ter apoio prioritário.</p></div>
        <div className="text-right"><p className="text-3xl font-bold text-gold">5.000 Kz</p><p className="text-xs text-muted-foreground">por 30 dias · pagamento antecipado</p></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Selo Premium","Identificação Premium na tua área de artista."],
          ["Apoio prioritário","Chat individual com a administração para pagamentos e assistência."],
          ["Gestão do plano","Estado, validade e histórico dos teus pedidos num só lugar."],
          ["Submissões acompanhadas","Acompanha o estado das faixas submetidas na tua conta."],
        ].map(([title,desc])=><div key={title} className="rounded-xl border border-border/70 bg-background/60 p-3"><div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-gold"/>{title}</div><p className="mt-1 text-xs text-muted-foreground">{desc}</p></div>)}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {active ? <><Badge className="bg-emerald-600">Premium activo</Badge><span className="text-sm text-muted-foreground">Válido até {expiry}</span></> : <Badge variant="secondary">Plano gratuito</Badge>}
        <span className="text-xs text-muted-foreground">Sem teste grátis e sem renovação automática.</span>
      </div>
    </section>

    {active && <section className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4"><div className="flex items-center gap-2 font-semibold"><BadgeCheck className="h-5 w-5 text-emerald-600"/> A tua conta tem Premium activo</div><p className="mt-1 text-sm text-muted-foreground">As vantagens Premium estão disponíveis até {expiry}. A renovação é manual.</p></section>}

    {!active && <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold">Activar Premium</h3>
      <p className="text-sm text-muted-foreground">Escolhe um método que esteja activo. Os métodos só aparecem depois de a administração configurar os dados de recebimento.</p>
      {methods.isLoading ? <div className="h-10 animate-pulse rounded bg-secondary"/> : !methods.data?.length ? <p className="rounded-lg bg-muted p-3 text-sm">Ainda não há métodos de pagamento activos. Contacta a administração pelo chat ou volta mais tarde.</p> :
        <><div className="grid gap-2 sm:grid-cols-2">{methods.data.map(m=><button type="button" key={m.id} onClick={()=>setMethod(m.method_code)} className={"rounded-lg border p-3 text-left text-sm "+(method===m.method_code?"border-gold bg-gold/5":"border-border")}>{m.display_name}</button>)}</div>
          {selectedMethod && <div className="rounded-lg bg-muted/60 p-3 text-sm"><p className="font-medium">Instruções de pagamento</p>{Object.entries(selectedMethod.instructions||{}).map(([k,v])=><p key={k} className="mt-1"><span className="text-muted-foreground">{k}: </span>{v}</p>)}</div>}
          <Button variant="gold" disabled={!method||busy} onClick={createOrder}>{busy?"A criar pedido…":"Criar pedido de 5.000 Kz"}</Button></>}
    </section>}

    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Os meus pagamentos</h3><Button variant="ghost" size="sm" onClick={()=>orders.refetch()}><RefreshCw className="mr-2 h-4 w-4"/>Actualizar</Button></div>
      {orders.data?.length ? orders.data.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"><div><p className="text-sm font-medium">{money(Number(o.amount))} · {methodLabels[o.payment_method||""]||o.payment_method||"—"}</p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-AO")} {o.provider_reference? "· Ref. "+o.provider_reference:""}</p></div><Badge variant={o.status==="paid"?"default":"secondary"}>{statusLabels[o.status]||o.status}</Badge></div>) : <p className="text-sm text-muted-foreground">Ainda não tens pedidos Premium.</p>}
    </section>

    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-gold"/><h3 className="font-semibold">Chat com a administração</h3></div>
      {threads.data?.length ? <div className="flex flex-wrap gap-2">{threads.data.map(t=><Button key={t.id} size="sm" variant={threadId===t.id?"gold":"outline"} onClick={()=>setActiveThread(t.id)}>{statusLabels[t.payment_status]||t.payment_status}</Button>)}</div> : <p className="text-sm text-muted-foreground">O chat será criado quando iniciares um pedido de pagamento.</p>}
      {threadId && <><div className="max-h-72 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-3">{messages.data?.map(m=><div key={m.id} className={"max-w-[90%] rounded-lg p-3 text-sm "+(m.sender_id===userId?"ml-auto bg-gold/10":"bg-muted")}><p>{m.body||"Comprovativo enviado"}</p>{m.attachment_path&&<button className="mt-2 inline-flex items-center gap-1 text-xs underline" onClick={()=>openAttachment(m.attachment_path!)}><Paperclip className="h-3 w-3"/>Abrir anexo</button>}<p className="mt-1 text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-AO")}</p></div>)}</div>
        <form onSubmit={sendMessage} className="space-y-2"><Textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Escreve uma mensagem…" maxLength={5000}/><Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/><Button type="submit" disabled={busy||(!message.trim()&&!file)}>{busy?"A enviar…":"Enviar mensagem / comprovativo"}</Button></form>
      </>}
      <p className="text-xs text-muted-foreground">Um comprovativo não confirma automaticamente a entrada do dinheiro. Transferências manuais ficam em análise até confirmação bancária; pagamentos AppyPay serão confirmados pela API e webhook após configuração.</p>
    </section>
  </div>;
}
