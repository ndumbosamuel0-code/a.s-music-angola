import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { formatKz, splitRevenue } from "@/lib/finance";
import { useSettings } from "@/lib/data";

export function FinanceExample() {
  const { data: settings } = useSettings();
  const [gross, setGross] = useState(100000);
  const [pct, setPct] = useState<number | null>(null);
  const distributorPct = pct ?? Number(settings?.distributor_commission ?? 0);
  const share = Number(settings?.platform_share ?? 10);
  const r = splitRevenue(gross, distributorPct, share);
  const rows = [
    ["Valor bruto", r.gross],
    [`Comissão do distribuidor (${distributorPct}%)`, r.commission],
    ["Saldo após comissão", r.afterCommission],
    [`A.S MUSIC (${share}%)`, r.platform],
    [`Artista (${100 - share}%)`, r.artist],
  ] as const;
  return (
    <div className="rounded-xl border border-gold/30 bg-card p-6">
      <p className="mb-4 inline-block rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
        Proposta sujeita a contrato · exemplo ilustrativo
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g">Valor bruto de exemplo (Kz)</Label>
          <Input
            id="g"
            type="number"
            min={0}
            value={gross}
            onChange={(e) => setGross(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p">Comissão do distribuidor (%) — por definir</Label>
          <Input
            id="p"
            type="number"
            min={0}
            max={100}
            value={distributorPct}
            onChange={(e) => setPct(Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <dl className="mt-6 divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{formatKz(v)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        A comissão efetiva do distribuidor ainda não está definida. Nenhum valor aqui representa
        receita real.
      </p>
    </div>
  );
}
