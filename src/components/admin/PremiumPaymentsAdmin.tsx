import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type MethodCode = "multicaixa_express" | "bank_transfer" | "payment_reference" | "unitel_money";
type Method = { id: string; method_code: MethodCode; display_name: string; instructions: Record<string, string>; is_enabled: boolean };
type Order = { id: string; user_id: string; amount: number; currency: string; status: string; payment_method: string | null; provider: string; provider_reference: string | null; created_at: string };
type Field = { key: string; label: string; placeholder: string; required?: boolean };

// Nenhum canal pode ser activado antes da aprovação escrita do banco/prestador.
// Depois da aprovação, adicionar aqui apenas os métodos autorizados individualmente.
const APPROVED_PAYMENT_METHODS: MethodCode[] = [];

const METHOD_FIELDS: Record<MethodCode, Field[]> = {
  multicaixa_express: [
    { key: "phone", label: "Número Multicaixa Express", placeholder: "Ex.: 9XXXXXXXX", required: true },
    { key: "account_holder", label: "Nome do titular", placeholder: "Nome associado à conta", required: true },
    { key: "instructions", label: "Instruções para o artista", placeholder: "Indica como deve efectuar o pagamento." },
  ],
  bank_transfer: [
    { key: "bank_name", label: "Nome do banco", placeholder: "Ex.: BAI, BFA, BIC", required: true },
    { key: "account_holder", label: "Titular da conta pessoal do administrador principal", placeholder: "Nome completo exactamente como consta no banco", required: true },
    { key: "iban", label: "IBAN", placeholder: "AO06 ..." , required: true },
    { key: "account_number", label: "Número da conta (opcional)", placeholder: "Número da conta" },
    { key: "instructions", label: "Instruções para o artista", placeholder: "Inclui a identificação que o artista deve indicar na transferência." },
  ],
  payment_reference: [
    { key: "entity", label: "Entidade", placeholder: "Código de entidade", required: true },
    { key: "beneficiary", label: "Beneficiário", placeholder: "Nome do beneficiário", required: true },
    { key: "instructions", label: "Instruções para o artista", placeholder: "A referência de pagamento deverá ser fornecida para cada pedido. Não coloques aqui uma referência reutilizável." },
  ],
  unitel_money: [
    { key: "phone", label: "Número UNITEL Money", placeholder: "Ex.: 9XXXXXXXX", required: true },
    { key: "account_holder", label: "Nome do titular", placeholder: "Nome associado à carteira", required: true },
    { key: "instructions", label: "Instruções para o artista", placeholder: "Indica como deve efectuar o pagamento." },
  ],
};

export function PremiumPaymentsAdmin() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});
  const q = useQuery({
    queryKey: ["admin", "premium-payments"],
    queryFn: async () => {
      const db = supabase as any;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { principal: false, methods: [], orders: [] };
      const { data: control, error: controlError } = await db.from("platform_control").select("principal_admin_id").eq("id", true).maybeSingle();
      if (controlError) throw controlError;
      if (control?.principal_admin_id !== auth.user.id) return { principal: false, methods: [], orders: [] };
      const [{ data: methods, error: methodsError }, { data: orders, error: ordersError }] = await Promise.all([
        db.from("platform_payment_methods").select("id,method_code,display_name,instructions,is_enabled").order("display_name"),
        db.from("billing_payment_orders").select("id,user_id,amount,currency,status,payment_method,provider,provider_reference,created_at").eq("item_code", "premium_monthly").order("created_at", { ascending: false }).limit(100),
      ]);
      if (methodsError) throw methodsError;
      if (ordersError) throw ordersError;
      return { principal: true, methods: (methods || []) as Method[], orders: (orders || []) as Order[] };
    },
  });

  function valuesFor(method: Method) {
    return draft[method.id] ?? Object.fromEntries(
      Object.entries(method.instructions || {}).map(([key, value]) => [key, String(value ?? "")]),
    );
  }

  async function save(method: Method, enabled: boolean) {
    if (enabled && !APPROVED_PAYMENT_METHODS.includes(method.method_code)) {
      toast.error("A activação está bloqueada até existir aprovação escrita do banco/prestador para este método.");
      return;
    }
    const instructions = valuesFor(method);
    const required = METHOD_FIELDS[method.method_code] ?? [];
    if (enabled && required.some((field) => field.required && !instructions[field.key]?.trim())) {
      toast.error("Preenche todos os campos obrigatórios antes de activar este método.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("platform_payment_methods").update({
      instructions,
      is_enabled: enabled,
      updated_by: auth.user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", method.id);
    if (error) toast.error(error.message);
    else {
      toast.success(enabled ? "Dados guardados e método activado." : "Dados guardados. Método desactivado.");
      qc.invalidateQueries({ queryKey: ["admin", "premium-payments"] });
    }
  }

  async function confirm(order: Order) {
    if (!window.confirm("Confirmaste no banco que recebeste 5.000 Kz deste pedido?")) return;
    const { error } = await (supabase as any).rpc("confirm_manual_premium_payment", { p_payment_order_id: order.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Pagamento confirmado. O Premium foi activado automaticamente por 30 dias.");
      qc.invalidateQueries({ queryKey: ["admin", "premium-payments"] });
    }
  }

  if (q.isLoading) return <div className="mt-4 h-32 animate-pulse rounded-xl bg-secondary" />;
  if (q.error) return <p className="mt-4 text-sm text-destructive">Erro: {(q.error as Error).message}</p>;
  if (!q.data?.principal) return <p className="mt-4 rounded-xl border p-4 text-sm">Área reservada ao administrador principal.</p>;

  return (
    <div className="mt-4 space-y-5">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Configurar os teus métodos de recebimento</h2>
        <p className="mt-1 text-sm text-muted-foreground">Como a conta de recebimento é uma conta pessoal comum do administrador principal, podes preparar e guardar os dados, mas a activação está bloqueada até o banco/prestador confirmar por escrito que aceita este uso. Nunca coloques PIN, palavra-passe, códigos OTP ou chaves API nestes campos.</p>
        <div className="mt-4 space-y-4">
          {q.data.methods.map((method) => (
            <MethodEditor
              key={method.id}
              method={method}
              values={valuesFor(method)}
              onChange={(key, value) => setDraft((current) => ({ ...current, [method.id]: { ...valuesFor(method), [key]: value } }))}
              onSave={(enabled) => save(method, enabled)}
            />
          ))}
        </div>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Pedidos Premium</h2>
        <p className="mt-1 text-xs text-muted-foreground">Só confirma transferências depois de veres o crédito na conta. Comprovativos enviados pelos artistas não confirmam, por si só, que o dinheiro chegou.</p>
        <div className="mt-3 space-y-3">
          {q.data.orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{new Intl.NumberFormat("pt-AO").format(Number(order.amount))} Kz · {order.payment_method || "—"}</p>
                <p className="text-xs text-muted-foreground">Utilizador {order.user_id.slice(0, 8)} · {new Date(order.created_at).toLocaleString("pt-AO")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={order.status === "paid" ? "default" : "secondary"}>{order.status}</Badge>
                {order.status === "pending" && order.provider === "manual" && <Button size="sm" onClick={() => confirm(order)}>Confirmar recebimento</Button>}
              </div>
            </div>
          ))}
          {!q.data.orders.length && <p className="text-sm text-muted-foreground">Sem pedidos.</p>}
        </div>
      </section>
    </div>
  );
}

function MethodEditor({ method, values, onChange, onSave, canActivate }: {
  method: Method;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: (enabled: boolean) => void;
  canActivate: boolean;
}) {
  const [enabled, setEnabled] = useState(method.is_enabled && APPROVED_PAYMENT_METHODS.includes(method.method_code));
  const fields = METHOD_FIELDS[method.method_code] ?? [];
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{method.display_name}</div>
        <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Activo" : "Desactivado"}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.key === "instructions" ? "sm:col-span-2" : ""}>
            <Label htmlFor={method.id + "-" + field.key}>{field.label}{field.required ? " *" : ""}</Label>
            {field.key === "instructions" ? (
              <Textarea id={method.id + "-" + field.key} className="mt-1" rows={3} value={values[field.key] ?? ""} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} />
            ) : (
              <Input id={method.id + "-" + field.key} className="mt-1" value={values[field.key] ?? ""} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} autoComplete="off" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Os dados só serão apresentados aos artistas quando este método estiver activo.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!canActivate} onClick={() => setEnabled((current) => !current)}>{canActivate ? (enabled ? "Desactivar" : "Activar") : "Activação bloqueada"}</Button>
        <Button size="sm" onClick={() => onSave(enabled)}>Guardar dados</Button>
      </div>
    </div>
  );
}
