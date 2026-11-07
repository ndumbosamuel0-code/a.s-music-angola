import { createFileRoute, redirect } from "@tanstack/react-router";
import { PremiumPaymentsAdmin } from "@/components/admin/PremiumPaymentsAdmin";
import { PremiumSupportAdmin } from "@/components/admin/PremiumSupportAdmin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/premium-admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/painel" });
  },
  head: () => ({ meta: [{ title: "Pagamentos Premium — Administração A.S MUSIC" }] }),
  component: PremiumAdminPage,
});
function PremiumAdminPage() {
  return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-bold">Gestão do Premium</h1><PremiumPaymentsAdmin/><div className="mt-8"><PremiumSupportAdmin/></div></main>;
}
