import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { DemoBadge, EmptyState, TrackGridSkeleton } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "@/lib/data";

export const Route = createFileRoute("/artistas")({
  head: () => ({
    meta: [
      { title: "Artistas — A.S MUSIC" },
      {
        name: "description",
        content:
          "Descobre os artistas da A.S MUSIC, incluindo os perfis fictícios claramente identificados como demonstração.",
      },
      { property: "og:title", content: "Artistas — A.S MUSIC" },
      {
        property: "og:description",
        content: "Explora perfis de artistas e as suas faixas autorizadas na A.S MUSIC.",
      },
    ],
  }),
  component: ArtistsPage,
});

function ArtistImage({ path, name }: { path: string | null; name: string }) {
  const { data: url } = useSignedUrl("covers", path);
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gold/20 bg-secondary">
      {url ? (
        <img
          src={url}
          alt={`Fotografia de ${name}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <UserRound className="h-10 w-10 text-gold" aria-hidden="true" />
      )}
    </div>
  );
}

function ArtistsPage() {
  const [term, setTerm] = useState("");
  const artists = useQuery({
    queryKey: ["artists", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("featured", { ascending: false })
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = useMemo(() => {
    const q = term.trim().toLocaleLowerCase("pt-AO");
    if (!q) return artists.data ?? [];
    return (artists.data ?? []).filter((artist) =>
      `${artist.name} ${artist.province ?? ""}`.toLocaleLowerCase("pt-AO").includes(q),
    );
  }, [artists.data, term]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Artistas</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Conhece os perfis e entra em cada página para ver as faixas publicadas. Os nomes assinalados
        “Demo” são fictícios.
      </p>
      <div className="mt-6">
        <label htmlFor="artist-search" className="sr-only">
          Pesquisar artista ou província
        </label>
        <Input
          id="artist-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Pesquisar artista ou província…"
          className="h-11 max-w-xl"
        />
      </div>
      <div className="mt-8">
        {artists.isLoading ? (
          <TrackGridSkeleton n={8} />
        ) : artists.error ? (
          <div className="space-y-3">
            <EmptyState title="Não foi possível carregar os artistas." />
            <Button variant="silver" onClick={() => artists.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !filtered.length ? (
          <EmptyState
            title="Nenhum artista encontrado."
            text="Experimenta outro nome ou província."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((artist) => (
              <Link
                key={artist.id}
                to="/artista/$slug"
                params={{ slug: artist.slug }}
                className="group rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-gold/50"
              >
                <ArtistImage path={artist.image_url} name={artist.name} />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <p className="truncate font-medium group-hover:text-gold">{artist.name}</p>
                  {artist.is_demo && <DemoBadge />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {artist.province ? `${artist.province}, Angola` : "Angola"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
