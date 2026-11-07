import { createFileRoute, redirect } from "@tanstack/react-router";
import { PremiumCenter } from "@/components/PremiumCenter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/premium")({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Plano Premium — A.S MUSIC ANGOLA" }] }),
  component: PremiumPage,
});
function PremiumPage() {
  const { user } = Route.useRouteContext();
  return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-bold">Plano Premium</h1><PremiumCenter userId={user.id}/></main>;
}
