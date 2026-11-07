import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useSession } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { SLOGAN, WHATSAPP_URL } from "@/lib/brand";

const NAV = [
  { to: "/explorar", label: "Explorar" },
  { to: "/artistas", label: "Artistas" },
  { to: "/para-artistas", label: "Para artistas" },
  { to: "/distribuicao", label: "Distribuição" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const authLinks = data?.user ? (
    <>
      {data.isAdmin && (
        <Link
          to="/admin"
          className="text-sm text-gold hover:underline"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      )}
      <Link
        to="/painel"
        className="text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(false)}
      >
        A minha conta
      </Link>
      <Button variant="silver" size="sm" onClick={signOut}>
        Sair
      </Button>
    </>
  ) : (
    <Button variant="gold" size="sm" asChild>
      <Link to="/auth" onClick={() => setOpen(false)}>
        Entrar
      </Link>
    </Button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-sm text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">{authLinks}</div>
        <button
          className="md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-base" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <div className="flex flex-wrap items-center gap-3">{authLinks}</div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">{SLOGAN}</p>
          <p className="text-xs text-muted-foreground">
            Projeto independente angolano em desenvolvimento.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/explorar" className="text-muted-foreground hover:text-foreground">
            Explorar música
          </Link>
          <Link to="/artistas" className="text-muted-foreground hover:text-foreground">
            Artistas
          </Link>
          <Link to="/para-artistas" className="text-muted-foreground hover:text-foreground">
            Para artistas
          </Link>
          <Link to="/distribuicao" className="text-muted-foreground hover:text-foreground">
            Distribuição e direitos
          </Link>
          <Link to="/contacto" className="text-muted-foreground hover:text-foreground">
            Contacto
          </Link>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Todo o conteúdo é publicado apenas com autorização dos titulares dos direitos. Faixas
            marcadas “Demo” são exemplos sem áudio.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="text-gold hover:underline"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} A.S MUSIC
      </p>
    </footer>
  );
}
