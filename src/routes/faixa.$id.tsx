import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Pause, Play, Lock } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cover, DemoBadge, EmptyState } from "@/components/TrackCard";
import { SoundWave } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { TRACK_SELECT, useSignedUrl, type TrackRow } from "@/lib/data";

export const Route = createFileRoute("/faixa/$id")({
  head: () => ({
    meta: [
      { title: "Faixa — A.S MUSIC" },
      { name: "description", content: "Ouve e descobre faixas autorizadas na A.S MUSIC." },
      { property: "og:title", content: "Faixa — A.S MUSIC" },
      { property: "og:description", content: "Descoberta musical angolana na A.S MUSIC." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["track", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select(TRACK_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TrackRow | null;
    },
  });
  if (q.isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  if (!q.data)
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Faixa não encontrada"
          text="Pode ter sido removida ou ainda não foi aprovada."
        />
      </div>
    );
  const t = q.data;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <Cover path={t.cover_url} title={t.title} className="aspect-square w-full" />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {t.genres && <span className="text-sm text-gold">{t.genres.name}</span>}
            {t.is_demo && <DemoBadge />}
          </div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          {t.artists ? (
            <Link
              to="/artista/$slug"
              params={{ slug: t.artists.slug }}
              className="text-lg text-silver hover:text-gold"
            >
              {t.artist_name}
            </Link>
          ) : (
            <p className="text-lg text-silver">{t.artist_name}</p>
          )}
          <Player track={t} />
          {t.description && <p className="text-muted-foreground">{t.description}</p>}
          {t.credits && (
            <p className="text-sm">
              <span className="text-muted-foreground">Créditos: </span>
              {t.credits}
            </p>
          )}
          {t.release_date && (
            <p className="text-sm text-muted-foreground">
              Lançamento: {new Date(t.release_date).toLocaleDateString("pt-AO")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Player({ track }: { track: TrackRow }) {
  const { data: url, isLoading } = useSignedUrl("audio", track.audio_path);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const available = !!url;

  const state = !track.audio_path
    ? track.is_demo
      ? "Faixa de demonstração — sem ficheiro de áudio."
      : "Áudio ainda não disponível."
    : isLoading
      ? "A preparar o áudio…"
      : !available
        ? "Reprodução indisponível: autorização não confirmada."
        : playing
          ? "A reproduzir"
          : "Pronto a reproduzir";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="gold"
          size="icon"
          className="h-12 w-12 rounded-full"
          disabled={!available}
          aria-label={playing ? "Pausar" : "Reproduzir"}
          onClick={() => {
            const a = ref.current;
            if (!a) return;
            playing ? a.pause() : a.play();
          }}
        >
          {available ? playing ? <Pause /> : <Play /> : <Lock />}
        </Button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SoundWave active={playing} /> {state}
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-gold-gradient" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {track.download_allowed && available ? (
          <Button variant="silver" size="sm" asChild>
            <a href={url} download>
              <Download /> Download
            </a>
          </Button>
        ) : (
          <Button
            variant="silver"
            size="sm"
            disabled
            title="Download não autorizado pelos titulares"
          >
            <Download /> Indisponível
          </Button>
        )}
      </div>
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
          }}
        />
      )}
    </div>
  );
}
