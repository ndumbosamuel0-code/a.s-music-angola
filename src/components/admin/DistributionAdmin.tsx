import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";

type Track = {
  id: string;
  title: string;
  artist_name: string;
  genre_id: string | null;
  release_date: string | null;
  credits: string | null;
  rights_holders: string | null;
  rights_confirmed: boolean;
  consent_streaming: boolean;
  audio_path: string | null;
  cover_url: string | null;
  license_id: string | null;
  is_demo: boolean;
};

type License = {
  id: string;
  holder: string;
  territory: string;
  allows_streaming: boolean;
  starts_at: string | null;
  ends_at: string | null;
  verification_status: string;
};

function licenseIsCurrent(license: License | undefined, today: string) {
  return (
    !!license &&
    license.verification_status === "verified" &&
    license.allows_streaming &&
    (!license.starts_at || license.starts_at <= today) &&
    (!license.ends_at || license.ends_at >= today)
  );
}

export function DistributionAdmin() {
  const [selected, setSelected] = useState<string[]>([]);
  const tracks = useQuery({
    queryKey: ["admin", "distribution-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select(
          "id,title,artist_name,genre_id,release_date,credits,rights_holders,rights_confirmed,consent_streaming,audio_path,cover_url,license_id,is_demo,status",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Track & { status: string })[];
    },
  });
  const licenses = useQuery({
    queryKey: ["admin", "distribution-licenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licenses")
        .select("id,holder,territory,allows_streaming,starts_at,ends_at,verification_status");
      if (error) throw error;
      return (data ?? []) as License[];
    },
  });
  const genres = useQuery({
    queryKey: ["admin", "distribution-genres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("genres").select("id,name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("distribution_status")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const licenseById = useMemo(
    () => new Map((licenses.data ?? []).map((l) => [l.id, l])),
    [licenses.data],
  );
  const genreById = useMemo(
    () => new Map((genres.data ?? []).map((g) => [g.id, g.name])),
    [genres.data],
  );
  const candidates = (tracks.data ?? []).filter(
    (t) =>
      !t.is_demo &&
      t.rights_confirmed &&
      t.consent_streaming &&
      !!t.audio_path &&
      licenseIsCurrent(t.license_id ? licenseById.get(t.license_id) : undefined, today),
  );
  const candidateIds = candidates.map((t) => t.id);
  const selectedTracks = candidates.filter((t) => selected.includes(t.id));

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((x) => x !== id),
    );
  }

  function exportManifest() {
    if (!selectedTracks.length) {
      toast.error("Selecciona pelo menos uma faixa elegível.");
      return;
    }
    const manifest = {
      schema_version: "1.0",
      generated_at: new Date().toISOString(),
      platform: "A.S MUSIC ANGOLA",
      partner: "Revelator (integração pendente de contrato e credenciais)",
      delivery_scope: "all_stores_enabled_in_partner_contract",
      note: "Manifesto de preparação. Não é uma entrega à distribuidora e não confirma publicação em lojas.",
      releases: selectedTracks.map((t) => {
        const license = t.license_id ? licenseById.get(t.license_id) : undefined;
        return {
          internal_track_id: t.id,
          title: t.title,
          primary_artist: t.artist_name,
          genre: t.genre_id ? (genreById.get(t.genre_id) ?? null) : null,
          intended_release_date: t.release_date,
          credits: t.credits,
          rights_holders: t.rights_holders,
          audio_storage_path: t.audio_path,
          artwork_storage_path: t.cover_url,
          rights: {
            confirmed_by_submitter: t.rights_confirmed,
            streaming_consent: t.consent_streaming,
            license_holder: license?.holder ?? null,
            territory: license?.territory ?? null,
            license_verified: license?.verification_status === "verified",
            license_allows_streaming: license?.allows_streaming ?? false,
            license_starts_at: license?.starts_at ?? null,
            license_ends_at: license?.ends_at ?? null,
          },
        };
      }),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `as-music-lote-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Manifesto do lote exportado. Nenhuma faixa foi enviada à distribuidora.");
  }

  if (tracks.isLoading || licenses.isLoading || genres.isLoading || settings.isLoading) {
    return <div className="mt-4 h-32 animate-pulse rounded-xl bg-secondary" />;
  }
  if (tracks.error || licenses.error || genres.error) {
    return (
      <div className="mt-4 space-y-3">
        <EmptyState
          title="Não foi possível carregar os lançamentos."
          text="Verifica as permissões da conta e tenta novamente."
        />
        <Button
          variant="silver"
          onClick={() => {
            tracks.refetch();
            licenses.refetch();
            genres.refetch();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Ligação à distribuidora</h2>
          <Badge variant="outline">Não ligada</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings.data?.distribution_status || "Acordos e integrações por confirmar"}. O envio
          automático para todas as lojas incluídas no contrato só será activado depois do
          onboarding, documentação técnica e credenciais oficiais da Revelator.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          As credenciais serão configuradas apenas no servidor. Nunca as coloques nesta página nem
          no código do navegador.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Faixas aprovadas</p>
          <p className="mt-1 text-2xl font-semibold">{tracks.data?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Elegíveis para preparar</p>
          <p className="mt-1 text-2xl font-semibold text-gold">{candidates.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Seleccionadas neste lote</p>
          <p className="mt-1 text-2xl font-semibold">{selectedTracks.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Preparar lançamentos em lote</h2>
          <p className="text-sm text-muted-foreground">
            Selecciona várias faixas e exporta um manifesto único.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="silver" onClick={() => setSelected(candidateIds)}>
            Seleccionar elegíveis
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Limpar selecção
          </Button>
          <Button
            size="sm"
            variant="gold"
            disabled={!selectedTracks.length}
            onClick={exportManifest}
          >
            Exportar manifesto ({selectedTracks.length})
          </Button>
        </div>
      </div>

      {!tracks.data?.length ? (
        <EmptyState
          title="Ainda não existem faixas aprovadas."
          text="As faixas aparecem aqui depois de serem aprovadas pela administração."
        />
      ) : !candidates.length ? (
        <EmptyState
          title="Nenhuma faixa pronta para distribuição."
          text="É necessário ter áudio carregado, direitos confirmados, consentimento de streaming e licença verificada, válida e autorizada para streaming."
        />
      ) : (
        <div className="space-y-2">
          {candidates.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-yellow-500"
                checked={selected.includes(t.id)}
                onChange={(e) => toggle(t.id, e.target.checked)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {t.title}
                  <Badge>Elegível</Badge>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {t.artist_name} ·{" "}
                  {t.genre_id
                    ? (genreById.get(t.genre_id) ?? "Género não indicado")
                    : "Género não indicado"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Licença: {t.license_id ? (licenseById.get(t.license_id)?.holder ?? "—") : "—"} ·
                  Território:{" "}
                  {t.license_id ? (licenseById.get(t.license_id)?.territory ?? "—") : "—"}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        O manifesto contém metadados e caminhos internos dos ficheiros. Não contém os áudios nem os
        envia para lojas. A entrega real será feita pelo conector oficial, depois de configurado e
        testado.
      </p>
    </div>
  );
}
