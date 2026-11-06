import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/data";

export const Route = createFileRoute("/distribuicao")({
  head: () => ({
    meta: [
      { title: "Distribuição e direitos — A.S MUSIC" },
      { name: "description", content: "Como a A.S MUSIC trata streaming, download e a futura distribuição digital, sempre com autorização dos titulares." },
      { property: "og:title", content: "Distribuição e direitos — A.S MUSIC" },
      { property: "og:description", content: "Streaming, download e distribuição digital com respeito pelos direitos." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: s } = useSettings();
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-bold">Distribuição e <span className="text-gold-gradient">direitos</span></h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Na plataforma A.S MUSIC</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Streaming apenas de faixas com autorização verificada.</li>
            <li>Download só quando a licença e o artista o permitem.</li>
            <li>Ficheiros de áudio guardados de forma privada.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Distribuição externa</h2>
          <p className="mt-2 text-sm text-muted-foreground">Spotify, Apple Music, Deezer, YouTube Music e outras lojas digitais.</p>
          <p className="mt-4 inline-block rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">{s?.distribution_status ?? "Acordos e integrações em negociação / por confirmar"}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">A A.S MUSIC não tem, nesta fase, parceiros de distribuição nem licenças de catálogo confirmadas. Um catálogo amplo de música angolana só será integrado mediante autorização ou licenciamento escrito dos titulares ou distribuidores.</p>
    </div>
  );
}
