import { MetaCard } from "@/components/meta-card";
import { MetaForm } from "@/components/meta-form";
import type { MetaComProgresso } from "@/types/database";

type MetaDashboardProps = {
  metas: MetaComProgresso[];
};

export function MetaDashboard({ metas }: MetaDashboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-emerald-600">MetaPoupança</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          Suas metas financeiras
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Cadastre objetivos, acompanhe quanto já guardou e veja quanto precisa
          poupar por mês para chegar no prazo.
        </p>
      </header>

      <MetaForm />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Metas ativas</h2>
          <span className="text-sm text-zinc-500">
            {metas.length} {metas.length === 1 ? "meta" : "metas"}
          </span>
        </div>

        {metas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-base font-medium text-zinc-700">
              Nenhuma meta cadastrada ainda
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Use o formulário acima para criar sua primeira meta financeira.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {metas.map((meta) => (
              <MetaCard key={meta.id} meta={meta} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
