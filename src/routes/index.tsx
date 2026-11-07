import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Crown } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/hero-waves.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoundWave } from "@/components/Logo";
import { EmptyState, TrackCard, TrackGridSkeleton } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { TRACK_SELECT, useGenres, type TrackRow } from "@/lib/data";
import { SLOGAN, WHATSAPP_URL } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A.S MUSIC — Onde o teu som chega mais longe." },
      {
        name: "description",
        content:
          "Descobre música angolana independente: Kizomba, Kuduro, Semba, Afro House, Rap, Gospel e Zouk.",
      },
      { property: "og:title", content: "A.S MUSIC — Onde o teu som chega mais longe." },
      {
        property: "og:description",
        content: "Plataforma angolana independente de descoberta musical e submissão de músicas.",
      },
    ],
  }),
  component: Index,
});

function useTracks(key: "featured" | "recent") {
  return useQuery({
    queryKey: ["tracks", key],
    queryFn: async () => {
      const result =
        key === "featured"
          ? await supabase.from("tracks").select(TRACK_SELECT).eq("featured", true).limit(4)
          : await supabase.from("tracks").select(TRACK_SELECT).order("release_date", { ascending: false }).limit(8);
      if (result.error) throw result.error;
      return result.data as TrackRow[];
    },
  });
}

function Section({
  title,
  to,
  children,
}: {
  title: string;
  to?: "/explorar" | "/artistas";
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        {to && (
          <Link to={to} className="text-sm text-gold hover:underline">
            Ver tudo
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function TrackGrid({ q }: { q: ReturnType<typeof useTracks> }) {
  if (q.isLoading) return <TrackGridSkeleton />;
  if (q.error)
    return (
      <EmptyState
        title="Não foi possível carregar as faixas."
        text="Tenta novamente daqui a pouco."
      />
    );
  if (!q.data?.length) return <EmptyState title="Ainda não há faixas aqui." />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {q.data.map((t) => (
        <TrackCard key={t.id} track={t} />
      ))}
    </div>
  );
}

function Index() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const featured = useTracks("featured");
  const recent = useTracks("recent");
  const genres = useGenres();
  const artists = useQuery({
    queryKey: ["artists", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("featured", true)
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">
            <Crown className="h-3.5 w-3.5" /> Projeto independente angolano · em desenvolvimento
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            <span className="text-gold-gradient">A.S</span> MUSIC
          </h1>
          <p className="mt-4 flex items-center gap-3 text-lg text-silver md:text-2xl">
            <SoundWave /> {SLOGAN}
          </p>
          <form
            className="mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/explorar", search: { q: term } });
            }}
            role="search"
          >
            <label htmlFor="hero-search" className="sr-only">
              Pesquisar música
            </label>
            <Input
              id="hero-search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Pesquisar artista ou título…"
              className="h-11 bg-card/80"
            />
            <Button type="submit" variant="gold" className="h-11">
              <Search /> Pesquisar
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="silver" asChild>
              <Link to="/para-artistas">Sou artista</Link>
            </Button>
            <Button variant="ghost" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Enviar música por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Section title="Destaques" to="/explorar">
        <TrackGrid q={featured} />
      </Section>
      <Section title="Lançamentos recentes" to="/explorar">
        <TrackGrid q={recent} />
      </Section>

      <Section title="Artistas em destaque" to="/artistas">
        {artists.isLoading ? (
          <TrackGridSkeleton n={3} />
        ) : !artists.data?.length ? (
          <EmptyState title="Sem artistas em destaque." />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {artists.data.map((a) => (
              <Link
                key={a.id}
                to="/artista/$slug"
                params={{ slug: a.slug }}
                className="group rounded-xl border border-border bg-card p-4 text-center hover:border-gold/50"
              >
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient font-display text-xl text-primary-foreground">
                  {a.name.replace(/Demo /, "").charAt(0)}
                </div>
                <p className="truncate font-medium group-hover:text-gold">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.province}
                  {a.is_demo && " · Demo"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Explorar por género">
        <div className="flex flex-wrap gap-3">
          {genres.data?.map((g) => (
            <Link
              key={g.id}
              to="/explorar"
              search={{ genero: g.slug }}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm hover:border-gold hover:text-gold"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </Section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <p className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
          Nota: todas as faixas e artistas marcados “Demo” são conteúdo fictício de demonstração,
          sem ficheiro de áudio. A A.S MUSIC ainda não tem catálogo licenciado nem acordos de
          distribuição confirmados.
        </p>
      </section>
    </>
  );
}
