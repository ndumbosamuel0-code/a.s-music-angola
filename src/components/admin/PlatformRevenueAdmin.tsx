import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BadgeCheck, Clock3, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";

type Summary = { source: string; status: string; currency: string; total_amount: number; event_count: number };
type RevenueEvent = { id: string; source: string; status: string; currency: string; amount: number; provider: string; event_occurred_at: string; created_at: string };

const SOURCE_LABEL: Record<string, string> = {
  ads: "Publicidade",
  premium: "Subscrições premium",
  artist_services: "Serviços para artistas",
  streaming: "Streaming",
  distribution: "Distribuição",
  other: "Outras receitas",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  paid: "Paga",
  reversed: "Estornada",
};
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " " + currency;

export function PlatformRevenueAdmin() {
  const query = useQuery({
    queryKey: ["admin", "platform-revenue"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { principal: false, summary: [], events: [], schemaMissing: false };

      const db = supabase as any;
      const { data: control, error: controlError } = await db
        .from("platform_control")
        .select("principal_admin_id")
        .eq("id", true)
        .maybeSingle();
      if (controlError) throw controlError;
      if (!control || control.principal_admin_id !== auth.user.id) {
        return { principal: false, summary: [], events: [], schemaMissing: false };
      }

      const { data: summary, error: summaryError } = await db
        .from("platform_revenue_summary")
        .select("source,status,currency,total_amount,event_count")
        .order("source");
      if (summaryError) {
        if (summaryError.code === "42P01" || summaryError.code === "PGRST205" || summaryError.code === "PGRST204") {
          return { principal: true, summary: [], events: [], schemaMissing: true };
        }
        throw summaryError;
      }

      const { data: events, error: eventsError } = await db
        .from("platform_revenue_ledger")
        .select("id,source,status,currency,amount,provider,event_occurred_at,created_at")
        .order("event_occurred_at", { ascending: false })
        .limit(50);
      if (eventsError) throw eventsError;
      return {
        principal: true,
        summary: (summary ?? []) as Summary[],
        events: (events ?? []) as RevenueEvent[],
        schemaMissing: false,
      };
    },
    staleTime: 30_000,
  });

  if (query.isLoading) return <div className="mt-4 h-40 animate-pulse rounded-xl bg-secondary" />;
  if (query.error) return <div className="mt-4 space-y-3"><EmptyState title="Não foi possível carregar as receitas." text="Confirma a ligação à base de dados e as permissões." /><Button variant="silver" onClick={() => query.refetch()}>Tentar novamente</Button></div>;
  if (!query.data?.principal) return <div className="mt-4 rounded-xl border border-warning/40 bg-warning/5 p-5"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" /> Área reservada</div><p className="mt-2 text-sm text-muted-foreground">Este painel só pode ser consultado pela conta definida como administrador principal da A.S MUSIC ANGOLA.</p></div>;
  if (query.data.schemaMissing) return <div className="mt-4 space-y-3 rounded-xl border border-warning/40 bg-warning/5 p-5"><div className="flex items-center gap-2 font-semibold"><Clock3 className="h-5 w-5" /> Estrutura financeira ainda não instalada</div><p className="text-sm text-muted-foreground">O painel está preparado, mas a migração segura da base de dados ainda precisa de revisão e aplicação. Nenhuma receita foi criada ou simulada.</p></div>;

  const totals = new Map<string, { pending: number; confirmed: number; paid: number }>();
  for (const item of query.data.summary) {
    const current = totals.get(item.currency) ?? { pending: 0, confirmed: 0, paid: 0 };
    if (item.status === "pending") current.pending += Number(item.total_amount);
    if (item.status === "confirmed") current.confirmed += Number(item.total_amount);
    if (item.status === "paid") current.paid += Number(item.total_amount);
    totals.set(item.currency, current);
  }

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-semibold">Receitas da plataforma</h2><p className="text-sm text-muted-foreground">Modelo previsto: publicidade leve e outras fontes aprovadas</p></div>
          <Badge variant="outline">Registo por eventos confirmados</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">O tempo de permanência, as visitas e os cliques não são convertidos automaticamente em dinheiro. Só entram valores comunicados por fornecedores e pagamentos reais, com referência única.</p>
      </div>

      <div role="status" className="rounded-xl border border-warning/50 bg-warning/5 p-4">
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" /> Monetização por visualizações ainda não activada</div>
        <p className="mt-2 text-sm text-muted-foreground">Neste momento não existe uma rede publicitária ligada, contrato de monetização aprovado, nem liquidações recebidas por visualizações. Por isso, a A.S MUSIC ainda não pode prometer nem apresentar ganhos por navegação, reprodução ou visualização a artistas e distribuidoras.</p>
        <p className="mt-2 text-sm text-muted-foreground">A activação exige aprovação escrita do fornecedor para o site e para Angola, validação do método de recebimento, integração de relatórios/webhooks e confirmação dos fundos efectivamente pagos à plataforma. Só depois serão calculadas e disponibilizadas as participações previstas nos contratos.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...totals.entries()].map(([currency, value]) => (
          <div key={currency} className="rounded-xl border border-border bg-card p-4 sm:col-span-2 xl:col-span-3">
            <p className="text-xs text-muted-foreground">Resumo em {currency}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Pendente</p><p className="mt-1 text-xl font-semibold">{money(value.pending, currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Confirmado / por liquidar</p><p className="mt-1 text-xl font-semibold text-gold">{money(value.confirmed, currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Pago à plataforma</p><p className="mt-1 text-xl font-semibold">{money(value.paid, currency)}</p></div>
            </div>
          </div>
        ))}
        {!totals.size && <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 xl:col-span-3"><div className="flex items-center gap-2 font-medium"><Wallet className="h-5 w-5" /> Ainda sem receitas registadas</div><p className="mt-1 text-sm text-muted-foreground">Quando os fornecedores e pagamentos estiverem ligados, os eventos reais aparecerão aqui.</p></div>}
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Receitas por origem e estado</h3>
        <div className="mt-3 space-y-2">
          {query.data.summary.map((item) => (
            <div key={item.source + item.status + item.currency} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0">
              <div><p className="text-sm font-medium">{SOURCE_LABEL[item.source] ?? item.source}</p><p className="text-xs text-muted-foreground">{STATUS_LABEL[item.status] ?? item.status} · {item.event_count} registo(s)</p></div>
              <p className="font-semibold tabular-nums">{money(Number(item.total_amount), item.currency)}</p>
            </div>
          ))}
          {!query.data.summary.length && <p className="text-sm text-muted-foreground">Sem movimentos financeiros.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-gold" /><h3 className="font-semibold">Histórico recente</h3></div>
        <div className="mt-3 space-y-3">
          {query.data.events.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
              <div><p className="text-sm font-medium">{SOURCE_LABEL[event.source] ?? event.source}</p><p className="text-xs text-muted-foreground">{event.provider} · {STATUS_LABEL[event.status] ?? event.status} · {new Date(event.event_occurred_at).toLocaleDateString("pt-AO")}</p></div>
              <p className="font-semibold tabular-nums">{money(Number(event.amount), event.currency)}</p>
            </div>
          ))}
          {!query.data.events.length && <p className="text-sm text-muted-foreground">Ainda não existem eventos financeiros.</p>}
        </div>
      </section>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Fontes previstas</h3>
        <div className="mt-2 flex flex-wrap gap-2">{Object.values(SOURCE_LABEL).map((label) => <Badge key={label} variant="secondary">{label}</Badge>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">Publicidade discreta, planos premium e serviços pagos só serão activados depois de aprovados os fornecedores, preços, termos e meios de recebimento compatíveis com Angola. Streaming e distribuição dependem também dos contratos e direitos aplicáveis.</p>
      </div>
    </div>
  );
}
