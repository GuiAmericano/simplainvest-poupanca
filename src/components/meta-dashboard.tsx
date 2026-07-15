import { MetaForm } from "@/components/meta-form";
import { MetasSection } from "@/components/metas-section";
import type { MetaComProgresso } from "@/types/database";

type MetaDashboardProps = {
  metas: MetaComProgresso[];
};

export function MetaDashboard({ metas }: MetaDashboardProps) {
  const metasAtivas = metas.filter((meta) => meta.progresso_percentual < 100);
  const metasConcluidas = metas.filter(
    (meta) => meta.progresso_percentual >= 100
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <MetaForm />

      <MetasSection
        title="METAS ATIVAS"
        metas={metasAtivas}
        emptyMessage="Nenhuma meta ativa no momento."
        defaultExpanded
      />

      <MetasSection
        title="METAS CONCLUÍDAS"
        metas={metasConcluidas}
        emptyMessage="Nenhuma meta concluída ainda."
      />
    </div>
  );
}
