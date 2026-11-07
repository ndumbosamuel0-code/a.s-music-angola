import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { useGenres } from "@/lib/data";
import { formatKz, splitRevenue } from "@/lib/finance";
import { validateUpload } from "@/lib/upload";
import { DistributorApplication } from "@/components/DistributorApplication";
import { PremiumCenter } from "@/components/PremiumCenter";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "A minha conta — A.S MUSIC" },
      {
        name: "description",
        content: "Perfil, submissões e simulações financeiras do artista na A.S MUSIC.",
      },
      { property: "og:title", content: "A minha conta — A.S MUSIC" },
      {
        property: "og:description",
        content: "Área pessoal para submeter música e acompanhar a revisão.",
      },
    ],
  }),
  component: Painel,
});

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  removed: "Removida",
};

function Painel() {
  const { user } = Route.useRouteContext();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">A minha conta</h1>
      <Tabs defaultValue="submeter" className="mt-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="submeter">Submeter música</TabsTrigger>
          <TabsTrigger value="submissoes">As minhas submissões</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="distribuidora">Distribuidora</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>
        <TabsContent value="submeter">
          <SubmitForm userId={user.id} />
        </TabsContent>
        <TabsContent value="submissoes">
          <Submissions userId={user.id} />
        </TabsContent>
        <TabsContent value="relatorios">
          <Reports />
        </TabsContent>
        <TabsContent value="perfil">
          <Profile userId={user.id} />
        </TabsContent>
        <TabsContent value="distribuidora">
          <DistributorApplication userId={user.id} email={user.email ?? ""} />
        </TabsContent>
        <TabsContent value="premium">
          <PremiumCenter userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Profile({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data,
  });
  const [form, setForm] = useState({
    display_name: "",
    artist_name: "",
    province: "",
    phone: "",
    bio: "",
  });
  useEffect(() => {
    if (q.data)
      setForm({
        display_name: q.data.display_name ?? "",
        artist_name: q.data.artist_name ?? "",
        province: q.data.province ?? "",
        phone: q.data.phone ?? "",
        bio: q.data.bio ?? "",
      });
  }, [q.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update(form).eq("id", userId);
    error ? toast.error("Não foi possível guardar.") : toast.success("Perfil guardado.");
  }
  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });
  return (
    <form
      onSubmit={save}
      className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2"
    >
      {q.error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2"
        >
          Não foi possível carregar o perfil. Podes tentar guardar novamente ou recarregar a página.
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="dn">Nome</Label>
        <Input id="dn" {...f("display_name")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="an">Nome artístico</Label>
        <Input id="an" {...f("artist_name")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pr">Província</Label>
        <Input id="pr" {...f("province")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ph">Telefone</Label>
        <Input id="ph" {...f("phone")} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea id="bio" {...f("bio")} />
      </div>
      <Button type="submit" variant="gold" className="sm:w-fit">
        Guardar perfil
      </Button>
    </form>
  );
}

function SubmitForm({ userId }: { userId: string }) {
  const genres = useGenres();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState({
    rights: false,
    streaming: true,
    download: false,
    promo: false,
  });

  async function upload(bucket: string, file: File) {
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return path;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!checks.rights) {
      toast.error("Tens de confirmar que controlas os direitos.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    const audio = fd.get("audio") as File;
    const cover = fd.get("cover") as File;
    const audioError = validateUpload(audio, "audio");
    if (audioError) {
      toast.error(audioError);
      return;
    }
    const coverError = cover?.size ? validateUpload(cover, "cover") : null;
    if (coverError) {
      toast.error(coverError);
      return;
    }

    const uploaded: [bucket: string, path: string][] = [];
    setBusy(true);
    try {
      const audio_path = await upload("audio", audio);
      uploaded.push(["audio", audio_path]);
      const cover_url = cover?.size ? await upload("covers", cover) : null;
      if (cover_url) uploaded.push(["covers", cover_url]);
      const { error } = await supabase.from("tracks").insert({
        title: String(fd.get("title")),
        artist_name: String(fd.get("artist")),
        genre_id: (fd.get("genre") as string) || null,
        description: String(fd.get("description") || ""),
        credits: String(fd.get("credits") || ""),
        rights_holders: String(fd.get("rights_holders")),
        audio_path,
        cover_url,
        rights_confirmed: true,
        submitted_by: userId,
        consent_streaming: checks.streaming,
        consent_download: checks.download,
        consent_promo: checks.promo,
      });
      if (error) throw error;
      toast.success("Submissão enviada! Fica pendente até revisão.");
      form.reset();
      setChecks({ rights: false, streaming: true, download: false, promo: false });
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
    } catch (err) {
      await Promise.all(
        uploaded.map(([bucket, path]) => supabase.storage.from(bucket).remove([path])),
      );
      toast.error("Falha no envio: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-6">
      <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
        O envio não garante publicação. Cada faixa é revista pela administração e só é publicada
        após confirmação dos direitos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="artist">Artista *</Label>
          <Input id="artist" name="artist" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="genre">Género</Label>
          <select
            id="genre"
            name="genre"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Escolher…</option>
            {genres.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rights_holders">Titulares dos direitos *</Label>
          <Input
            id="rights_holders"
            name="rights_holders"
            required
            placeholder="Ex.: autor, compositor, produtor"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cover">Capa (imagem, até 5MB)</Label>
          <Input id="cover" name="cover" type="file" accept="image/*" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audio">Ficheiro de áudio * (até 50MB)</Label>
          <Input id="audio" name="audio" type="file" accept="audio/*" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="credits">Créditos</Label>
        <Textarea id="credits" name="credits" placeholder="Voz, produção, mistura…" />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Direitos e consentimentos</legend>
        {(
          [
            [
              "rights",
              "Confirmo que controlo os direitos desta obra ou tenho autorização dos titulares. *",
            ],
            ["streaming", "Autorizo streaming na plataforma A.S MUSIC."],
            ["download", "Autorizo download gratuito na plataforma."],
            ["promo", "Autorizo uso promocional (redes sociais, destaques)."],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={checks[k]}
              onCheckedChange={(v) => setChecks({ ...checks, [k]: !!v })}
              className="mt-0.5"
            />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <Button type="submit" variant="gold" disabled={busy}>
        {busy ? "A enviar…" : "Enviar para revisão"}
      </Button>
    </form>
  );
}

function Submissions({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["my-submissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("id,title,artist_name,status,created_at")
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary" />;
  if (q.error)
    return (
      <div className="mt-4 space-y-3">
        <EmptyState
          title="Não foi possível carregar as tuas submissões."
          text="Verifica a ligação e tenta novamente."
        />
        <Button variant="silver" onClick={() => q.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  if (!q.data?.length)
    return (
      <div className="mt-4">
        <EmptyState title="Ainda não submeteste nenhuma faixa." />
      </div>
    );
  return (
    <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
      {q.data.map((t) => (
        <li key={t.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.artist_name} · {new Date(t.created_at).toLocaleDateString("pt-AO")}
            </p>
          </div>
          <Badge
            variant={
              t.status === "approved"
                ? "default"
                : t.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {STATUS_LABEL[t.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function Reports() {
  const q = useQuery({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_reports")
        .select("*, artists(name)")
        .order("period", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: s } = useQuery({
    queryKey: ["settings"],
    queryFn: async () =>
      (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  if (q.isLoading) return <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary" />;
  if (q.error)
    return (
      <div className="mt-4 space-y-3">
        <EmptyState title="Não foi possível carregar os relatórios." />
        <Button variant="silver" onClick={() => q.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  if (!q.data?.length)
    return (
      <div className="mt-4">
        <EmptyState
          title="Sem relatórios."
          text="Os relatórios aparecem aqui quando a administração associar o teu perfil de artista. Ainda não existem receitas reais."
        />
      </div>
    );
  return (
    <div className="mt-4 space-y-3">
      {q.data.map((r) => {
        const x = splitRevenue(
          Number(r.gross),
          Number(r.distributor_commission_pct),
          Number(s?.platform_share ?? 10),
        );
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{r.period}</span>
              {r.is_demo && <Badge variant="outline">Dados de demonstração</Badge>}
            </div>
            <p className="mt-2 text-muted-foreground">
              Bruto {formatKz(x.gross)} · Após comissão {formatKz(x.afterCommission)} · Artista{" "}
              {formatKz(x.artist)} · Estado: {r.payment_status}
            </p>
          </div>
        );
      })}
    </div>
  );
}
