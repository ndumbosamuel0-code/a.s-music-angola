import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Thread = {
  id: string;
  user_id: string;
  payment_order_id: string | null;
  payment_status: string;
  created_at: string;
};
type Message = {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  created_at: string;
};
export function PremiumSupportAdmin() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const threads = useQuery({
    queryKey: ["admin", "premium-support-threads"],
    queryFn: async () => {
      const db = supabase;
      const { data, error } = await db
        .from("billing_support_threads")
        .select("id,user_id,payment_order_id,payment_status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Thread[];
    },
  });
  const threadId = selected || threads.data?.[0]?.id || null;
  const messages = useQuery({
    queryKey: ["admin", "premium-support-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const db = supabase;
      const { data, error } = await db
        .from("billing_support_messages")
        .select("id,sender_id,body,attachment_path,created_at")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return (data || []) as Message[];
    },
  });
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!threadId || !body.trim()) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("billing_support_messages").insert({
      thread_id: threadId,
      sender_id: data.user.id,
      body: body.trim(),
      message_type: "message",
    });
    if (error) toast.error(error.message);
    else {
      setBody("");
      qc.invalidateQueries({ queryKey: ["admin", "premium-support-messages", threadId] });
      toast.success("Resposta enviada.");
    }
  }
  async function openFile(path: string) {
    const { data, error } = await supabase.storage
      .from("billing-proofs")
      .createSignedUrl(path, 300);
    if (error) toast.error(error.message);
    else if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-gold" />
        <h2 className="font-semibold">Chat com artistas</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Conversas privadas de pagamento e suporte Premium.
      </p>
      {threads.data?.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {threads.data.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={
                  "w-full rounded-lg border p-3 text-left text-xs " +
                  (threadId === t.id ? "border-gold bg-gold/5" : "border-border")
                }
              >
                <p className="font-medium">Artista {t.user_id.slice(0, 8)}</p>
                <p className="mt-1 text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("pt-AO")}
                </p>
                <Badge
                  className="mt-2"
                  variant={t.payment_status === "paid" ? "default" : "secondary"}
                >
                  {t.payment_status}
                </Badge>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-3">
              {messages.data?.map((m) => (
                <div key={m.id} className="rounded-lg bg-background p-3 text-sm">
                  <p>{m.body || "Comprovativo enviado"}</p>
                  {m.attachment_path && (
                    <button
                      onClick={() => openFile(m.attachment_path!)}
                      className="mt-2 inline-flex items-center gap-1 text-xs underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      Abrir comprovativo
                    </button>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {m.sender_id.slice(0, 8)} · {new Date(m.created_at).toLocaleString("pt-AO")}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="space-y-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Responder ao artista…"
                maxLength={5000}
              />
              <Button disabled={!body.trim()}>Enviar resposta</Button>
            </form>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Ainda não existem conversas.</p>
      )}
    </section>
  );
}
