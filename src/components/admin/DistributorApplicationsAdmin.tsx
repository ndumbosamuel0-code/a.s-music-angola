import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string; user_id: string; company_name: string; contact_name: string;
  contact_email: string; phone: string; province: string | null; website: string | null;
  catalog_description: string; status: string; review_note: string | null; created_at: string;
};

export function DistributorApplicationsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "distributor-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("distributor_applications")
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
  });

  async function review(id: string, decision: "approved" | "rejected") {
    const note = window.prompt(decision === "approved" ? "Observação (opcional):" : "Motivo da recusa:");
    if (note === null) return;
    const { error } = await supabase.rpc("review_distributor_application", {
      p_application_id: id, p_decision: decision, p_note: note,
    });
    if (error) toast.error(error.message);
    else toast.success(decision === "approved" ? "Distribuidora aprovada e função activada." : "Candidatura recusada.");
    await qc.invalidateQueries({ queryKey: ["admin", "distributor-applications"] });
  }

  if (q.isLoading) return <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary" />;
  if (q.error) return <div className="mt-4"><EmptyState title="Não foi possível carregar as candidaturas." text="Esta área só pode ser consultada pelo administrador principal." /><Button className="mt-3" variant="silver" onClick={() => q.refetch()}>Tentar novamente</Button></div>;
  if (!q.data?.length) return <div className="mt-4"><EmptyState title="Ainda não existem candidaturas de distribuidoras." /></div>;

  return (
    <div className="mt-4 space-y-3">
      {q.data.map((a) => (
        <section key={a.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{a.company_name}</h2>
            <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>
              {a.status === "approved" ? "Aprovada" : a.status === "rejected" ? "Recusada" : "Pendente"}
            </Badge>
          </div>
          <div className="grid gap-1 text-sm sm:grid-cols-2">
            <p>Contacto: {a.contact_name}</p><p>Email: {a.contact_email}</p>
            <p>Telefone: {a.phone}</p><p>Província: {a.province || "—"}</p>
            <p>Website: {a.website || "—"}</p><p>Conta: {a.user_id}</p>
          </div>
          <p className="whitespace-pre-wrap rounded-lg bg-secondary p-3 text-sm">{a.catalog_description}</p>
          {a.review_note && <p className="text-sm text-muted-foreground">Observação: {a.review_note}</p>}
          {a.status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="gold" onClick={() => review(a.id, "approved")}>Aprovar e activar</Button>
              <Button size="sm" variant="destructive" onClick={() => review(a.id, "rejected")}>Recusar</Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Recebida em {new Date(a.created_at).toLocaleString("pt-AO")}</p>
        </section>
      ))}
    </div>
  );
}
