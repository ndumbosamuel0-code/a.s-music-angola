import { Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import type { TrackRow } from "@/lib/data";
import { useSignedUrl } from "@/lib/data";
import { Badge } from "./ui/badge";

export function Cover({ path, title, className = "" }: { path: string | null; title: string; className?: string }) {
  const { data: url } = useSignedUrl("covers", path);
  return (
    <div className={`relative overflow-hidden rounded-lg bg-secondary bg-hero ${className}`}>
      {url ? (
        <img src={url} alt={`Capa de ${title}`} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music2 className="h-1/3 w-1/3 text-gold/60" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function DemoBadge() {
  return <Badge variant="outline" className="border-silver/40 text-[10px] uppercase tracking-wider text-silver">Demo</Badge>;
}

export function TrackCard({ track }: { track: TrackRow }) {
  return (
    <Link to="/faixa/$id" params={{ id: track.id }} className="group block space-y-2">
      <Cover path={track.cover_url} title={track.title} className="aspect-square transition group-hover:shadow-gold" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium group-hover:text-gold">{track.title}</p>
          <p className="truncate text-sm text-muted-foreground">{track.artist_name}</p>
        </div>
        {track.is_demo && <DemoBadge />}
      </div>
    </Link>
  );
}

export function TrackGridSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square animate-pulse rounded-lg bg-secondary" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
