"use client";

import { AporteModal } from "@/components/aporte-modal";
import { MovimentacoesHistorico } from "@/components/movimentacoes-historico";
import { ProgressBar } from "@/components/progress-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MetaComProgresso } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MetaCardProps = {
  meta: MetaComProgresso;
};

export function MetaCard({ meta }: MetaCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [highlightProgress, setHighlightProgress] = useState(false);
  const [historicoKey, setHistoricoKey] = useState(0);

  const metaAtingida = meta.progresso_percentual >= 100;

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function handleAporteSuccess() {
    setSuccessMessage("Aporte registrado com sucesso!");
    setHighlightProgress(true);
    setHistoricoKey((current) => current + 1);
    setShowHistorico(true);
    router.refresh();

    setTimeout(() => setHighlightProgress(false), 1200);
  }

  return (
    <>
      <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">{meta.nome}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Até {formatDate(meta.data_limite)}
            </p>
          </div>
          {metaAtingida && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Concluída
            </span>
          )}
        </div>

        <div className="mt-4">
          <ProgressBar
            percentual={meta.progresso_percentual}
            highlight={highlightProgress}
          />
        </div>

        {successMessage && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

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

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={metaAtingida}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Registrar aporte
          </button>
          <button
            type="button"
            onClick={() => setShowHistorico((current) => !current)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {showHistorico ? "Ocultar" : "Histórico"}
          </button>
        </div>

        {showHistorico && (
          <div className="mt-5">
            <h4 className="mb-3 text-sm font-semibold text-zinc-800">
              Histórico de aportes
            </h4>
            <MovimentacoesHistorico
              key={historicoKey}
              metaId={meta.id}
            />
          </div>
        )}
      </article>

      <AporteModal
        metaId={meta.id}
        metaNome={meta.nome}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAporteSuccess}
      />
    </>
  );
}
