import { MetaDashboard } from "@/components/meta-dashboard";
import { listMetasComProgresso } from "@/lib/services/meta-progresso";

export default async function Home() {
  const metas = await listMetasComProgresso();

  return (
    <main className="flex-1">
      <MetaDashboard metas={metas} />
    </main>
  );
}
