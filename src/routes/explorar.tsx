import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { EmptyState, TrackCard, TrackGridSkeleton } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { TRACK_SELECT, useGenres, type TrackRow } from "@/lib/data";

type Search = { q?: string | undefined; genero?: string | undefined };

export const Route = createFileRoute("/explorar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" && s["q"] ? (s["q"] as string) : undefined,
    genero: typeof s["genero"] === "string" && s["genero"] ? (s["genero"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explorar música — A.S MUSIC" },
      { name: "description", content: "Pesquisa e filtra música por artista, título e género: Kizomba, Kuduro, Semba, Afro House e mais." },
      { property: "og:title", content: "Explorar música — A.S MUSIC" },
      { property: "og:description", content: "Catálogo da A.S MUSIC com filtros por género." },
    ],
  }),
  component: Explorar,
});

function Explorar() {
  const { q = "", genero } = Route.useSearch();
  const navigate = useNavigate({ from: "/explorar" });
  const genres = useGenres();
  const genreId = genres.data?.find((g) => g.slug === genero)?.id;

  const tracks = useQuery({
    queryKey: ["tracks", "explore", q, genreId ?? null],
    enabled: !genero || !!genreId,
    queryFn: async () => {
      let query = supabase.from("tracks").select(TRACK_SELECT).order("release_date", { ascending: false });
      if (genreId) query = query.eq("genre_id", genreId);
      if (q) {
        const safe = q.replace(/[,()%]/g, " ");
        query = query.or(`title.ilike.%${safe}%,artist_name.ilike.%${safe}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as TrackRow[];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Explorar música</h1>
      <p className="mt-1 text-muted-foreground">Catálogo em construção — só faixas aprovadas e autorizadas.</p>
      <div className="mt-6">
        <label htmlFor="q" className="sr-only">Pesquisar por artista ou título</label>
        <Input id="q" defaultValue={q} placeholder="Pesquisar por artista ou título…" className="h-11 max-w-xl"
          onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }), replace: true })} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por género">
        <button onClick={() => navigate({ search: (s) => ({ ...s, genero: undefined }) })}
          className={`rounded-full border px-4 py-1.5 text-sm ${!genero ? "border-gold text-gold" : "border-border"}`} aria-pressed={!genero}>Todos</button>
        {genres.data?.map((g) => (
          <button key={g.id} onClick={() => navigate({ search: (s) => ({ ...s, genero: g.slug }) })} aria-pressed={genero === g.slug}
            className={`rounded-full border px-4 py-1.5 text-sm ${genero === g.slug ? "border-gold text-gold" : "border-border hover:border-gold/50"}`}>{g.name}</button>
        ))}
      </div>
      <div className="mt-8">
        {tracks.isLoading ? <TrackGridSkeleton n={8} /> : tracks.error ? <EmptyState title="Erro ao carregar o catálogo." /> :
          !tracks.data?.length ? <EmptyState title="Nenhuma faixa encontrada." text="Experimenta outro termo ou género." /> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tracks.data.map((t) => <TrackCard key={t.id} track={t} />)}
            </div>
          )}
      </div>
    </div>
  );
}
