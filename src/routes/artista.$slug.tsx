import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DemoBadge, EmptyState, TrackCard, TrackGridSkeleton } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { TRACK_SELECT, type TrackRow } from "@/lib/data";

export const Route = createFileRoute("/artista/$slug")({
  head: () => ({
    meta: [
      { title: "Artista — A.S MUSIC" },
      { name: "description", content: "Perfil de artista e faixas na A.S MUSIC." },
      { property: "og:title", content: "Artista — A.S MUSIC" },
      { property: "og:description", content: "Descobre artistas angolanos na A.S MUSIC." },
    ],
  }),
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const { data: artist, error } = await supabase.from("artists").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!artist) return null;
      const { data: tracks } = await supabase.from("tracks").select(TRACK_SELECT).eq("artist_id", artist.id);
      return { artist, tracks: (tracks ?? []) as unknown as TrackRow[] };
    },
  });
  if (q.isLoading) return <div className="mx-auto max-w-6xl px-4 py-16"><TrackGridSkeleton /></div>;
  if (!q.data) return <div className="mx-auto max-w-6xl px-4 py-16"><EmptyState title="Artista não encontrado" /></div>;
  const { artist, tracks } = q.data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-card bg-hero p-8 md:flex-row md:items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold-gradient font-display text-3xl text-primary-foreground">
          {artist.name.replace(/Demo /, "").charAt(0)}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><h1 className="text-3xl font-bold">{artist.name}</h1>{artist.is_demo && <DemoBadge />}</div>
          {artist.province && <p className="text-silver">{artist.province}, Angola</p>}
          {artist.bio && <p className="max-w-2xl text-muted-foreground">{artist.bio}</p>}
        </div>
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold">Faixas</h2>
      {!tracks.length ? <EmptyState title="Ainda sem faixas publicadas." /> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{tracks.map((t) => <TrackCard key={t.id} track={t} />)}</div>
      )}
    </div>
  );
}
