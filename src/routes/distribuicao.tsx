import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Headphones, Download, Globe2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/distribuicao")({
  head: () => ({
    meta: [
      { title: "Distribuição e direitos — A.S MUSIC" },
      { name: "description", content: "Consulta as opções de streaming, download e futura distribuição digital da A.S MUSIC." },
      { property: "og:title", content: "Distribuição e direitos — A.S MUSIC" },
      { property: "og:description", content: "Streaming, download e distribuição digital com respeito pelos direitos." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: s } = useSettings();
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Distribuição e <span className="text-gold-gradient">direitos</span></h1>
        <p className="mt-3 text-muted-foreground">Escolhe uma opção para continuares. Cada ação leva-te à área correspondente da plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-border bg-card p-6">
          <Headphones className="h-7 w-7 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Streaming na A.S MUSIC</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">Descobre as músicas disponíveis no catálogo. Só serão reproduzidas faixas publicadas com autorização verificada.</p>
          <Button className="mt-5 w-full" asChild>
            <Link to="/explorar">Explorar músicas</Link>
          </Button>
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-card p-6">
          <Download className="h-7 w-7 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Download de músicas</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">Consulta o catálogo. O botão de download só deve estar disponível nas faixas cuja licença permita descarregar.</p>
          <Button className="mt-5 w-full" variant="silver" asChild>
            <Link to="/explorar">Ver faixas disponíveis</Link>
          </Button>
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-card p-6">
          <Globe2 className="h-7 w-7 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Distribuição externa</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">Spotify, Apple Music, Deezer, YouTube Music e outras lojas. A integração ainda não está confirmada; contacta a equipa para manifestar interesse.</p>
          <p className="mt-4 inline-block w-fit rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">{s?.distribution_status ?? "Em preparação / por confirmar"}</p>
          <Button className="mt-5 w-full" variant="silver" asChild>
            <Link to="/contacto">Contactar a equipa</Link>
          </Button>
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-card p-6">
          <ShieldCheck className="h-7 w-7 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Direitos dos artistas</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">A tua música só deve ser publicada ou distribuída com autorização dos titulares dos direitos. Manténs o controlo sobre os usos que autorizas.</p>
          <Button className="mt-5 w-full" variant="silver" asChild>
            <Link to="/para-artistas">Ver área de artistas</Link>
          </Button>
        </section>
      </div>

      <p className="text-sm text-muted-foreground">Nesta fase, a A.S MUSIC ainda não tem parceiros de distribuição externa nem licenças de catálogo confirmadas. Não anunciamos publicação em lojas externas até existirem acordos e autorizações por escrito.</p>
    </div>
  );
}
