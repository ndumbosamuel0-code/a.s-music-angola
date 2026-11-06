import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, Upload, ShieldCheck, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanceExample } from "@/components/FinanceExample";
import { WHATSAPP_URL } from "@/lib/brand";

export const Route = createFileRoute("/para-artistas")({
  head: () => ({
    meta: [
      { title: "Para artistas — A.S MUSIC" },
      { name: "description", content: "Cria a tua conta, submete a tua música e acompanha a revisão. Envio não garante publicação." },
      { property: "og:title", content: "Para artistas — A.S MUSIC" },
      { property: "og:description", content: "Submete a tua música à A.S MUSIC." },
    ],
  }),
  component: Page,
});

const STEPS = [
  { icon: UserPlus, t: "Cria a tua conta", d: "Registo gratuito planeado para artistas angolanos independentes." },
  { icon: Upload, t: "Submete a tua faixa", d: "Título, género, capa, áudio, créditos e titulares dos direitos." },
  { icon: ShieldCheck, t: "Revisão administrativa", d: "A equipa verifica direitos e qualidade. O envio não garante publicação." },
  { icon: Globe2, t: "Publicação e futura distribuição", d: "Se aprovada, a faixa entra no catálogo. Distribuição externa ainda por confirmar." },
];

function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Para <span className="text-gold-gradient">artistas</span></h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Leva o teu som mais longe. Submete a tua música com segurança — tu manténs os teus direitos e decides os usos que autorizas.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <div key={s.t} className="rounded-xl border border-border bg-card p-6">
            <s.icon className="h-6 w-6 text-gold" aria-hidden="true" />
            <p className="mt-3 font-semibold">{i + 1}. {s.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="gold" asChild><Link to="/painel">Submeter música</Link></Button>
        <Button variant="silver" asChild><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Enviar dados por WhatsApp</a></Button>
      </div>
      <h2 className="mt-16 text-2xl font-bold">Modelo de partilha (informativo)</h2>
      <p className="mt-2 text-muted-foreground">Ainda não existem receitas nem pagamentos reais. Este é o modelo proposto para quando houver distribuição.</p>
      <div className="mt-6"><FinanceExample /></div>
    </div>
  );
}
