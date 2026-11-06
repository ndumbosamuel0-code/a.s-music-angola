import { Link } from "@tanstack/react-router";
import { useSettings, useSignedUrl } from "@/lib/data";

/** Espaço reservado para o logótipo oficial carregado pelo administrador. */
export function Logo() {
  const { data: settings } = useSettings();
  const { data: url } = useSignedUrl("covers", settings?.logo_url);
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="A.S MUSIC — início">
      {url ? (
        <img src={url} alt="A.S MUSIC" className="h-9 w-auto" />
      ) : (
        <span className="font-display text-lg font-bold tracking-tight">
          <span className="text-gold-gradient">A.S</span> <span className="text-silver">MUSIC</span>
        </span>
      )}
    </Link>
  );
}

export function SoundWave({ active = true, className = "" }: { active?: boolean; className?: string }) {
  return (
    <span className={`inline-flex h-4 items-end gap-0.5 ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full bg-gold ${active ? "wave-bar" : "h-1"}`}
          style={active ? { height: "100%", animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
    </span>
  );
}
