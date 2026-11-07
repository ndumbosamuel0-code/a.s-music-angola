import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useGenres } from "@/lib/data";
import { formatKz, splitRevenue } from "@/lib/finance";
import { canApproveTrack, canDownloadTrack } from "@/lib/rights";

export const Route = createFileRoute("/_authenticated/admin")({
  // UI guard only; every write is enforced by RLS + database triggers.
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/painel" });
  },
  head: () => ({ meta: [
    { title: "Administração — A.S MUSIC" },
    { name: "description", content: "Revisão de faixas, artistas, direitos e simulações financeiras na A.S MUSIC." },
    { property: "og:title", content: "Administração — A.S MUSIC" },
    { property: "og:description", content: "Gestão interna do catálogo e dos direitos A.S MUSIC." },
  ] }),
  component: Admin,
});

const STATUS: Record<string, string> = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada", removed: "Removida" };
const ADMIN_TABS: [string, string][] = [["geral", "Visão geral"], ["pendentes", "Pendentes"], ["catalogo", "Catálogo"], ["artistas", "Artistas"], ["generos", "Géneros"], ["direitos", "Direitos/licenças"], ["relatorios", "Relatórios"], ["administradores", "Administradores"], ["definicoes", "Definições"]];
const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";

function useAdmin<T>(key: string, fn: () => PromiseLike<{ data: T | null; error: unknown }>) {
  return useQuery({ queryKey: ["admin", key], queryFn: async () => { const { data, error } = await fn(); if (error) throw error; return (data ?? []) as T; } });
}
function useRefresh() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["admin"] }); }
function err(e: { message: string } | null, ok = "Guardado.") { e ? toast.error(e.message) : toast.success(ok); }

function Admin() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Administração</h1>
      <Tabs defaultValue="geral" className="mt-6">
        <TabsList className="h-auto flex-wrap">
          {ADMIN_TABS.map(([v, l]) => (
            <TabsTrigger key={v} value={v}>{l}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="geral"><Overview /></TabsContent>
        <TabsContent value="pendentes"><TracksAdmin onlyPending /></TabsContent>
        <TabsContent value="catalogo"><TracksAdmin /></TabsContent>
        <TabsContent value="artistas"><ArtistsAdmin /></TabsContent>
        <TabsContent value="generos"><GenresAdmin /></TabsContent>
        <TabsContent value="direitos"><LicensesAdmin /></TabsContent>
        <TabsContent value="relatorios"><ReportsAdmin /></TabsContent>
        <TabsContent value="administradores"><AdminsAdmin /></TabsContent>
        <TabsContent value="definicoes"><SettingsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const c = async (t: "tracks" | "artists" | "licenses", f?: (q: any) => any) => {
        let q: any = supabase.from(t).select("id", { count: "exact", head: true });
        if (f) q = f(q);
        return (await q).count ?? 0;
      };
      return {
        pending: await c("tracks", (q) => q.eq("status", "pending")),
        approved: await c("tracks", (q) => q.eq("status", "approved")),
        artists: await c("artists"),
        unverified: await c("licenses", (q) => q.neq("verification_status", "verified")),
      };
    },
  });
  const items = [["Submissões pendentes", q.data?.pending], ["Faixas aprovadas", q.data?.approved], ["Artistas", q.data?.artists], ["Licenças por verificar", q.data?.unverified]];
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l as string} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl text-gold">{v ?? "—"}</p></div>
      ))}
    </div>
  );
}

function AdminsAdmin() {
  const refresh = useRefresh();
  const profiles = useAdmin<{ id: string; display_name: string | null; full_name: string | null; email: string | null }[]>(
    "admin-candidates",
    () => supabase.from("profiles").select("id,display_name,full_name,email").order("display_name")
  );
  const roles = useAdmin<{ user_id: string; role: string }[]>(
    "admin-roles",
    () => supabase.from("user_roles").select("user_id,role")
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  async function grantAdmin(userId: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    err(error, "Acesso de administrador concedido.");
    refresh();
  }
  async function revokeAdmin(userId: string) {
    if (userId === currentUserId) {
      toast.error("Não podes retirar o teu próprio acesso nesta sessão.");
      return;
    }
    if (!confirm("Retirar o acesso de administrador desta conta?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    err(error, "Acesso de administrador removido.");
    refresh();
  }

  const adminIds = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-bold">Gerir administradores</h2>
        <p className="mt-1 text-sm text-muted-foreground">Concede ou retira acesso administrativo a contas já registadas. Por segurança, apenas administradores atuais podem usar esta área.</p>
      </div>
      {profiles.isLoading || roles.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-secondary" />
      ) : !profiles.data?.length ? (
        <EmptyState title="Nenhuma conta registada encontrada." />
      ) : (
        <div className="space-y-2">
          {profiles.data.map((p) => {
            const isAdmin = adminIds.has(p.id);
            const label = p.full_name || p.display_name || p.email || p.id.slice(0, 8);
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{p.email || "Email não disponível"} · ID {p.id.slice(0, 8)}</p>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Badge>Administrador</Badge>
                    <Button size="sm" variant="ghost" disabled={p.id === currentUserId} onClick={() => revokeAdmin(p.id)}>Retirar acesso</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="gold" onClick={() => grantAdmin(p.id)}>Adicionar como admin</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Só aparecem contas que já criaram uma conta na plataforma. O teu próprio acesso fica protegido nesta sessão.</p>
    </div>
  );
}

type AdminTrack = { id: string; title: string; artist_name: string; status: Database["public"]["Enums"]["track_status"]; featured: boolean; download_allowed: boolean; license_id: string | null; is_demo: boolean; audio_path: string | null; rights_holders: string | null; rights_confirmed: boolean; consent_download: boolean; consent_streaming: boolean; artist_id: string | null; admin_notes: string | null };

function TracksAdmin({ onlyPending }: { onlyPending?: boolean }) {
  const refresh = useRefresh();
  const tracks = useAdmin<AdminTrack[]>(onlyPending ? "pending" : "tracks", () => {
    let q = supabase.from("tracks").select("id,title,artist_name,status,featured,download_allowed,license_id,is_demo,audio_path,rights_holders,rights_confirmed,consent_download,consent_streaming,artist_id,admin_notes").order("created_at", { ascending: false });
    if (onlyPending) q = q.eq("status", "pending");
    return q;
  });
  const licenses = useAdmin<{ id: string; holder: string; verification_status: string; allows_streaming: boolean; allows_download: boolean; starts_at: string | null; ends_at: string | null }[]>("licenses-min", () => supabase.from("licenses").select("id,holder,verification_status,allows_streaming,allows_download,starts_at,ends_at"));
  const artists = useAdmin<{ id: string; name: string }[]>("artists-min", () => supabase.from("artists").select("id,name").order("name"));

  async function update(id: string, patch: Partial<AdminTrack>) {
    const { error } = await supabase.from("tracks").update(patch).eq("id", id);
    err(error); refresh();
  }
  async function listen(path: string) {
    const { data } = await supabase.storage.from("audio").createSignedUrl(path, 600);
    if (data) window.open(data.signedUrl, "_blank");
  }

  if (tracks.isLoading) return <div className="mt-4 h-32 animate-pulse rounded-xl bg-secondary" />;
  if (!tracks.data?.length) return <div className="mt-4"><EmptyState title={onlyPending ? "Sem submissões pendentes." : "Catálogo vazio."} /></div>;
  return (
    <div className="mt-4 space-y-3">
      {tracks.data.map((t) => {
        const license = licenses.data?.find((l) => l.id === t.license_id);
        return (
        <div key={t.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{t.title} {t.is_demo && <Badge variant="outline">Demo</Badge>}</p>
              <p className="text-xs text-muted-foreground">{t.artist_name} · Titulares: {t.rights_holders || "—"} · Consentimentos: {t.consent_streaming ? "streaming" : ""} {t.consent_download ? "download" : ""}</p>
            </div>
            <Badge variant={t.status === "approved" ? "default" : "secondary"}>{STATUS[t.status]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select className={sel} value={t.license_id ?? ""} onChange={(e) => update(t.id, { license_id: e.target.value || null })} aria-label="Licença">
              <option value="">Sem licença</option>
              {licenses.data?.map((l) => <option key={l.id} value={l.id}>{l.holder} ({l.verification_status})</option>)}
            </select>
            <select className={sel} value={t.artist_id ?? ""} onChange={(e) => update(t.id, { artist_id: e.target.value || null })} aria-label="Perfil de artista">
              <option value="">Sem perfil de artista</option>
              {artists.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label className="flex items-center gap-2">Destaque <Switch checked={t.featured} onCheckedChange={(v) => update(t.id, { featured: v })} /></label>
            <label className="flex items-center gap-2" title="Exige faixa aprovada, consentimento e licença de download válida">Download <Switch checked={t.download_allowed} disabled={!t.download_allowed && !canDownloadTrack(t, license)} onCheckedChange={(v) => update(t.id, { download_allowed: v })} /></label>
            {t.audio_path && <Button size="sm" variant="ghost" onClick={() => listen(t.audio_path!)}>Ouvir</Button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="gold" disabled={!canApproveTrack(t, license)} title="Exige direitos, consentimento e licença de streaming válidos" onClick={() => update(t.id, { status: "approved" })}>Aprovar</Button>
            <Button size="sm" variant="silver" onClick={() => update(t.id, { status: "rejected" })}>Rejeitar</Button>
            <Button size="sm" variant="ghost" onClick={() => { const v = prompt("Novo título", t.title); if (v) update(t.id, { title: v }); }}>Editar título</Button>
            <Button size="sm" variant="ghost" onClick={() => update(t.id, { status: "removed", featured: false })}>Remover</Button>
          </div>
        </div>
        );
      })}
      <p className="text-xs text-muted-foreground">A aprovação e o download são bloqueados pela base de dados quando a licença não está verificada.</p>
    </div>
  );
}

function ArtistsAdmin() {
  const refresh = useRefresh();
  const artists = useAdmin<any[]>("artists", () => supabase.from("artists").select("*").order("created_at", { ascending: false }));
  const profiles = useAdmin<{ id: string; display_name: string | null; artist_name: string | null }[]>("profiles", () => supabase.from("profiles").select("id,display_name,artist_name"));
  const [name, setName] = useState(""); const [province, setProvince] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("artists").insert({ name, province, slug });
    err(error, "Artista criado."); setName(""); refresh();
  }
  async function patch(id: string, p: Database["public"]["Tables"]["artists"]["Update"]) { err((await supabase.from("artists").update(p).eq("id", id)).error); refresh(); }
  async function promote(userId: string) { err((await supabase.from("user_roles").insert({ user_id: userId, role: "artist" })).error, "Função de artista atribuída."); }
  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
        <Input placeholder="Nome do artista" value={name} onChange={(e) => setName(e.target.value)} required className="max-w-xs" />
        <Input placeholder="Província" value={province} onChange={(e) => setProvince(e.target.value)} className="max-w-xs" />
        <Button variant="gold" type="submit">Adicionar artista</Button>
      </form>
      {artists.data?.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <span className="min-w-40 font-medium">{a.name} {a.is_demo && <Badge variant="outline">Demo</Badge>}</span>
          <label className="flex items-center gap-2">Destaque <Switch checked={a.featured} onCheckedChange={(v) => patch(a.id, { featured: v })} /></label>
          <select className={sel} value={a.owner_id ?? ""} onChange={(e) => { patch(a.id, { owner_id: e.target.value || null }); if (e.target.value) promote(e.target.value); }} aria-label="Conta associada">
            <option value="">Sem conta associada</option>
            {profiles.data?.map((p) => <option key={p.id} value={p.id}>{p.artist_name || p.display_name || p.id.slice(0, 8)}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Remover artista?")) { err((await supabase.from("artists").delete().eq("id", a.id)).error, "Removido."); refresh(); } }}>Remover</Button>
        </div>
      ))}
    </div>
  );
}

function GenresAdmin() {
  const genres = useGenres(); const qc = useQueryClient(); const [name, setName] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    err((await supabase.from("genres").insert({ name, slug, sort: (genres.data?.length ?? 0) + 1 })).error, "Género adicionado.");
    setName(""); qc.invalidateQueries({ queryKey: ["genres"] });
  }
  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo género" required className="max-w-xs" /><Button variant="gold">Adicionar</Button></form>
      <div className="flex flex-wrap gap-2">
        {genres.data?.map((g) => (
          <span key={g.id} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">{g.name}
            <button aria-label={`Remover ${g.name}`} className="text-muted-foreground hover:text-destructive" onClick={async () => { err((await supabase.from("genres").delete().eq("id", g.id)).error, "Removido."); qc.invalidateQueries({ queryKey: ["genres"] }); }}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

function LicensesAdmin() {
  const refresh = useRefresh();
  const list = useAdmin<any[]>("licenses", () => supabase.from("licenses").select("*").order("created_at", { ascending: false }));
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    let evidence_path: string | null = null;
    const file = fd.get("evidence") as File;
    if (file?.size) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("license-docs").upload(path, file);
      if (error) { setBusy(false); toast.error(error.message); return; }
      evidence_path = path;
    }
    const { error } = await supabase.from("licenses").insert({
      holder: String(fd.get("holder")), territory: String(fd.get("territory") || "Angola"),
      allows_streaming: fd.get("streaming") === "on", allows_download: fd.get("download") === "on",
      starts_at: (fd.get("starts_at") as string) || null, ends_at: (fd.get("ends_at") as string) || null,
      notes: String(fd.get("notes") || ""), evidence_path,
    });
    setBusy(false); err(error, "Licença registada."); if (!error) form.reset(); refresh();
  }
  async function setStatus(id: string, verification_status: "pending" | "verified" | "rejected") { err((await supabase.from("licenses").update({ verification_status }).eq("id", id)).error); refresh(); }
  async function openDoc(p: string) { const { data } = await supabase.storage.from("license-docs").createSignedUrl(p, 300); if (data) window.open(data.signedUrl, "_blank"); }
  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1"><Label htmlFor="holder">Titular *</Label><Input id="holder" name="holder" required /></div>
        <div className="space-y-1"><Label htmlFor="territory">Território</Label><Input id="territory" name="territory" defaultValue="Angola" /></div>
        <div className="space-y-1"><Label htmlFor="evidence">Evidência / documento</Label><Input id="evidence" name="evidence" type="file" /></div>
        <div className="space-y-1"><Label htmlFor="starts_at">Início</Label><Input id="starts_at" name="starts_at" type="date" /></div>
        <div className="space-y-1"><Label htmlFor="ends_at">Fim (prazo)</Label><Input id="ends_at" name="ends_at" type="date" /></div>
        <div className="space-y-1"><Label htmlFor="notes">Notas</Label><Input id="notes" name="notes" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="streaming" /> Streaming</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="download" /> Download</label>
        <Button variant="gold" disabled={busy}>Registar licença</Button>
      </form>
      {!list.data?.length ? <EmptyState title="Nenhuma licença registada." text="Sem licença verificada, nenhuma faixa real pode ser publicada." /> : list.data.map((l) => (
        <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <p className="font-medium">{l.holder} · {l.territory}</p>
            <p className="text-xs text-muted-foreground">{l.allows_streaming ? "Streaming" : "Sem streaming"} · {l.allows_download ? "Download" : "Sem download"} · {l.starts_at ?? "—"} → {l.ends_at ?? "sem fim"}</p>
          </div>
          <div className="flex items-center gap-2">
            {l.evidence_path && <Button size="sm" variant="ghost" onClick={() => openDoc(l.evidence_path)}>Ver documento</Button>}
            <select className={sel} value={l.verification_status} onChange={(e) => setStatus(l.id, e.target.value as any)} aria-label="Estado de verificação">
              <option value="pending">Por verificar</option><option value="verified">Verificada</option><option value="rejected">Rejeitada</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsAdmin() {
  const refresh = useRefresh();
  const list = useAdmin<any[]>("reports", () => supabase.from("financial_reports").select("*, artists(name)").order("period", { ascending: false }));
  const artists = useAdmin<{ id: string; name: string }[]>("artists-min", () => supabase.from("artists").select("id,name").order("name"));
  const settings = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data });
  const share = Number(settings.data?.platform_share ?? 10);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    err((await supabase.from("financial_reports").insert({ artist_id: String(fd.get("artist")), period: String(fd.get("period")), gross: Number(fd.get("gross")), distributor_commission_pct: Number(fd.get("pct")), is_demo: true })).error, "Simulação criada.");
    refresh();
  }
  return (
    <div className="mt-4 space-y-4">
      <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">Relatórios informativos. Nenhum pagamento real é processado nesta fase. Proposta sujeita a contrato.</p>
      <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4">
        <select name="artist" className={sel} required aria-label="Artista"><option value="">Artista…</option>{artists.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <Input name="period" placeholder="Período (2026-10)" required className="w-36" />
        <Input name="gross" type="number" placeholder="Bruto (Kz)" required className="w-36" />
        <Input name="pct" type="number" placeholder="Comissão %" defaultValue={Number(settings.data?.distributor_commission ?? 0)} className="w-28" />
        <span className="text-xs text-muted-foreground">Todos os relatórios são simulações, sem pagamento.</span>
        <Button variant="gold">Criar simulação</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left"><tr>{["Artista", "Período", "Bruto", "Com. distribuidor", "Após comissão", `A.S MUSIC ${share}%`, `Artista ${100 - share}%`, "Modalidade"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {list.data?.map((r) => {
              const x = splitRevenue(Number(r.gross), Number(r.distributor_commission_pct), share);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{r.artists?.name} {r.is_demo && <Badge variant="outline">Demo</Badge>}</td>
                  <td className="p-3">{r.period}</td><td className="p-3">{formatKz(x.gross)}</td>
                  <td className="p-3">{formatKz(x.commission)} ({r.distributor_commission_pct}%)</td>
                  <td className="p-3">{formatKz(x.afterCommission)}</td><td className="p-3">{formatKz(x.platform)}</td><td className="p-3">{formatKz(x.artist)}</td>
                  <td className="p-3"><Badge variant="outline">Simulação · sem pagamento</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function PayoutsAdmin() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [claiming, setClaiming] = useState(false);
  const control = useQuery({ queryKey: ["principal-admin"], queryFn: async () => {
    const { data, error } = await (supabase as any).from("platform_control").select("principal_admin_id").eq("id", true).single();
    if (error) throw error; return data as { principal_admin_id: string | null };
  }});
  const list = useQuery({ queryKey: ["artist-payouts"], queryFn: async () => {
    const { data, error } = await (supabase as any).from("artist_payout_requests").select("*").order("requested_at", { ascending: false });
    if (error) throw error; return data ?? [];
  }});
  const { data: userData } = useQuery({ queryKey: ["current-auth-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const isPrincipal = !!userData?.id && control.data?.principal_admin_id === userData.id;
  async function claim() {
    setClaiming(true);
    const { error } = await (supabase as any).rpc("claim_principal_admin");
    setClaiming(false);
    if (error) toast.error(error.message); else { toast.success("Esta conta ficou definida como administradora principal."); qc.invalidateQueries({ queryKey: ["principal-admin"] }); }
  }
  async function review(id: string, decision: "approved" | "rejected") {
    const { error } = await (supabase as any).rpc("review_artist_payout", { p_request_id: id, p_decision: decision, p_note: note || null });
    if (error) toast.error(error.message); else { toast.success(decision === "approved" ? "Pedido aprovado. Falta executar a transferência." : "Pedido recusado."); qc.invalidateQueries({ queryKey: ["artist-payouts"] }); }
  }
  async function markPaid(id: string) {
    const reference = prompt("Referência/comprovativo da transferência:");
    if (!reference) return;
    const { error } = await (supabase as any).rpc("mark_artist_payout_paid", { p_request_id: id, p_reference: reference });
    if (error) toast.error(error.message); else { toast.success("Pagamento registado."); qc.invalidateQueries({ queryKey: ["artist-payouts"] }); }
  }
  return <div className="mt-4 space-y-4">
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-bold">Administrador principal</h2>
      {control.data?.principal_admin_id ? <p className="mt-1 text-sm text-muted-foreground">{isPrincipal ? "Esta conta é a administradora principal." : "A administração principal já está atribuída a outra conta."}</p> : <><p className="mt-1 text-sm text-muted-foreground">Atribui a administração principal à tua conta atual. Esta ação só pode ser feita uma vez.</p><Button className="mt-3" variant="gold" disabled={claiming} onClick={claim}>{claiming ? "A definir…" : "Definir a minha conta como principal"}</Button></>}
    </div>
    <div className="space-y-2"><h2 className="font-bold">Pedidos de levantamento</h2>
      {!list.data?.length ? <EmptyState title="Ainda não existem pedidos de levantamento." /> : list.data.map((r: any) => <div key={r.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap justify-between gap-2"><strong>{formatKz(Number(r.amount_kz))}</strong><Badge variant={r.status === "paid" ? "default" : "secondary"}>{({pending:"Pendente",approved:"Aprovado",rejected:"Recusado",paid:"Pago",failed:"Falhado"} as Record<string,string>)[r.status] ?? r.status}</Badge></div>
        <p className="mt-2 text-xs text-muted-foreground">Artista: {r.artist_user_id} · {new Date(r.requested_at).toLocaleString("pt-AO")}</p>
        <p className="mt-2 text-sm">{r.account_snapshot?.account_holder} · {r.account_snapshot?.bank_name} · {r.account_snapshot?.iban || r.account_snapshot?.account_number}</p>
        {isPrincipal && r.status === "pending" && <div className="mt-3 flex flex-wrap gap-2"><Input placeholder="Observação (opcional)" value={note} onChange={e=>setNote(e.target.value)} className="max-w-xs"/><Button size="sm" variant="gold" onClick={()=>review(r.id,"approved")}>Aprovar</Button><Button size="sm" variant="destructive" onClick={()=>review(r.id,"rejected")}>Recusar</Button></div>}
        {isPrincipal && r.status === "approved" && <Button className="mt-3" size="sm" onClick={()=>markPaid(r.id)}>Registar transferência concluída</Button>}
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">A aprovação não transfere dinheiro automaticamente. A transferência deve ser executada no banco e só depois registada aqui com a referência.</p>
  </div>;
}

function SettingsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data });
  const [form, setForm] = useState({ distributor_commission: 0, platform_share: 10, distribution_status: "" });
  useEffect(() => { if (q.data) setForm({ distributor_commission: Number(q.data.distributor_commission), platform_share: Number(q.data.platform_share), distribution_status: q.data.distribution_status }); }, [q.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    err((await supabase.from("settings").update({ ...form, updated_at: new Date().toISOString() }).eq("id", 1)).error);
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function uploadLogo(file: File) {
    const path = `brand/logo-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) { toast.error(error.message); return; }
    err((await supabase.from("settings").update({ logo_url: path }).eq("id", 1)).error, "Logótipo oficial carregado.");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">Modelo financeiro (proposta)</h2>
        <div className="space-y-1"><Label htmlFor="dc">Comissão efetiva do distribuidor (%)</Label><Input id="dc" type="number" step="0.01" min={0} max={100} value={form.distributor_commission} onChange={(e) => setForm({ ...form, distributor_commission: Number(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="ps">Percentagem A.S MUSIC sobre o saldo (%)</Label><Input id="ps" type="number" step="0.01" min={0} max={100} value={form.platform_share} onChange={(e) => setForm({ ...form, platform_share: Number(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="ds">Estado da distribuição (texto público)</Label><Input id="ds" value={form.distribution_status} onChange={(e) => setForm({ ...form, distribution_status: e.target.value })} /></div>
        <Button variant="gold">Guardar definições</Button>
      </form>
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">Logótipo oficial</h2>
        <p className="text-sm text-muted-foreground">{q.data?.logo_url ? "Logótipo carregado. Podes substituí-lo." : "Ainda não foi carregado. O site mostra o nome “A.S MUSIC” em texto até lá."}</p>
        <Input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" aria-label="Carregar logótipo" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
      </div>
    </div>
  );
}
