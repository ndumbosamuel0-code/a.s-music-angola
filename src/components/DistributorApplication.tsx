import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Props = { userId: string; email?: string };

export function DistributorApplication({ userId, email = "" }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    company_name: "", contact_name: "", contact_email: email, phone: "",
    province: "", website: "", catalog_description: "",
  });
  const [busy, setBusy] = useState(false);
  const application = useQuery({
    queryKey: ["distributor-application", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("distributor_applications")
        .select("id,company_name,status,review_note,created_at")
        .eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("distributor_applications").insert({
        user_id: userId,
        ...form,
      });
      if (error) throw error;
      toast.success("Candidatura enviada. Aguarda a aprovação do administrador principal.");
      await qc.invalidateQueries({ queryKey: ["distributor-application", userId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a candidatura.");
    } finally {
      setBusy(false);
    }
  }

  if (application.isLoading) return <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary" />;
  if (application.error) return <p className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm">Não foi possível consultar a candidatura. Tenta novamente.</p>;
  if (application.data) {
    const status = application.data.status;
    const label = status === "approved" ? "Aprovada" : status === "rejected" ? "Recusada" : "Em análise";
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{application.data.company_name}</h2>
          <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {status === "approved"
            ? "A tua candidatura foi aprovada. A tua conta recebeu a função de distribuidora."
            : status === "rejected"
              ? "A candidatura não foi aprovada. Consulta a observação abaixo."
              : "A candidatura foi recebida e aguarda a análise do administrador principal."}
        </p>
        {application.data.review_note && <p className="rounded-lg bg-secondary p-3 text-sm">Observação: {application.data.review_note}</p>}
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((old) => ({ ...old, [key]: e.target.value }));

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Candidatura de distribuidora</h2>
        <p className="mt-1 text-sm text-muted-foreground">Preenche os dados da empresa. A função de distribuidora só será activada depois da aprovação do administrador principal.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1"><Label htmlFor="dist-company">Nome da empresa *</Label><Input id="dist-company" value={form.company_name} onChange={set("company_name")} required maxLength={160} /></div>
        <div className="space-y-1"><Label htmlFor="dist-contact">Pessoa de contacto *</Label><Input id="dist-contact" value={form.contact_name} onChange={set("contact_name")} required maxLength={160} /></div>
        <div className="space-y-1"><Label htmlFor="dist-email">Email de contacto *</Label><Input id="dist-email" type="email" value={form.contact_email} onChange={set("contact_email")} required /></div>
        <div className="space-y-1"><Label htmlFor="dist-phone">Telefone *</Label><Input id="dist-phone" value={form.phone} onChange={set("phone")} required maxLength={40} /></div>
        <div className="space-y-1"><Label htmlFor="dist-province">Província</Label><Input id="dist-province" value={form.province} onChange={set("province")} /></div>
        <div className="space-y-1"><Label htmlFor="dist-website">Website (opcional)</Label><Input id="dist-website" type="url" value={form.website} onChange={set("website")} placeholder="https://" /></div>
      </div>
      <div className="space-y-1"><Label htmlFor="dist-catalog">Que catálogo pretendes distribuir? *</Label><Textarea id="dist-catalog" value={form.catalog_description} onChange={set("catalog_description")} required minLength={10} maxLength={3000} /></div>
      <Button type="submit" variant="gold" disabled={busy}>{busy ? "A enviar…" : "Enviar candidatura"}</Button>
    </form>
  );
}
