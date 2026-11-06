import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/lib/brand";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — A.S MUSIC" },
      { name: "description", content: "Fala com a A.S MUSIC pelo WhatsApp para enviar a tua música ou tirar dúvidas." },
      { property: "og:title", content: "Contacto — A.S MUSIC" },
      { property: "og:description", content: "Contacta a A.S MUSIC pelo WhatsApp." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Fala connosco</h1>
      <p className="mt-3 text-muted-foreground">És artista e queres enviar a tua música? Tens dúvidas sobre direitos ou parcerias? Manda-nos mensagem — a mensagem já vem preparada com os dados que precisamos.</p>
      <Button variant="gold" size="lg" className="mt-8" asChild>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle /> Falar no WhatsApp</a>
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">+244 952 958 593</p>
    </div>
  );
}
