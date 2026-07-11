import { formatCurrency, formatDate } from "@/lib/format";
import type { MetaComProgresso } from "@/types/database";

type MetaCardProps = {
  meta: MetaComProgresso;
};

export function MetaCard({ meta }: MetaCardProps) {
  const metaAtingida = meta.progresso_percentual >= 100;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{meta.nome}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Até {formatDate(meta.data_limite)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {meta.progresso_percentual.toFixed(0)}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.min(meta.progresso_percentual, 100)}%` }}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Objetivo</dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {formatCurrency(meta.valor_objetivo)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Já guardado</dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {formatCurrency(meta.total_aportado)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Falta</dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {formatCurrency(meta.valor_restante)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Prazo restante</dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {meta.meses_restantes > 0
              ? `${meta.meses_restantes} ${meta.meses_restantes === 1 ? "mês" : "meses"}`
              : "Prazo encerrado"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Poupar por mês
        </p>
        <p className="mt-1 text-xl font-bold text-emerald-800">
          {metaAtingida
            ? "Meta atingida!"
            : formatCurrency(meta.valor_mensal_necessario)}
        </p>
      </div>
    </article>
  );
}
