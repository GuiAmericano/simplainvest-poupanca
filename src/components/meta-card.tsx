"use client";

import { MovimentacaoModal } from "@/components/aporte-modal";
import { MetaEvolucaoGrafico } from "@/components/meta-evolucao-grafico";
import { MovimentacoesHistorico } from "@/components/movimentacoes-historico";
import { MetaConcluidaModal } from "@/components/meta-concluida-modal";
import { PeriodoMudouModal } from "@/components/periodo-mudou-modal";
import { ProgressBar } from "@/components/progress-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import { btnEmeraldClass, btnRedClass } from "@/lib/button-styles";
import {
  calcularMudancaPeriodo,
  chavePeriodoVisto,
  type ResumoMudancaPeriodo,
} from "@/lib/calculations/mudanca-periodo";
import { dataCriacaoMeta } from "@/lib/calculations/juros-compostos";
import { chaveMetaConcluidaVista } from "@/lib/meta-concluida";
import type { MetaComProgresso } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MetaCardProps = {
  meta: MetaComProgresso;
};

export function MetaCard({ meta }: MetaCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [modalTipo, setModalTipo] = useState<"aporte" | "retirada" | null>(
    null
  );
  const [showHistorico, setShowHistorico] = useState(false);
  const [showGrafico, setShowGrafico] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightProgress, setHighlightProgress] = useState(false);
  const [historicoKey, setHistoricoKey] = useState(0);
  const [confirmDeleteMeta, setConfirmDeleteMeta] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resumoMudancaPeriodo, setResumoMudancaPeriodo] =
    useState<ResumoMudancaPeriodo | null>(null);
  const [showMetaConcluida, setShowMetaConcluida] = useState(false);
  const verificandoPeriodo = useRef(false);

  const metaAtingida = meta.progresso_percentual >= 100;
  const labelFaltaPeriodo = meta.falta_proximo_periodo
    ? "Previsto para o próximo período"
    : "Falta neste período";

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    const storageKey = chaveMetaConcluidaVista(meta.id);

    if (!metaAtingida) {
      localStorage.removeItem(storageKey);
      setShowMetaConcluida(false);
      return;
    }

    const jaVista = localStorage.getItem(storageKey) === "1";

    if (!jaVista) {
      setShowMetaConcluida(true);
    }
  }, [meta.id, metaAtingida]);

  function handleFecharMetaConcluida() {
    localStorage.setItem(chaveMetaConcluidaVista(meta.id), "1");
    setShowMetaConcluida(false);
  }

  useEffect(() => {
    if (meta.total_periodos === 0 || metaAtingida) {
      localStorage.setItem(chavePeriodoVisto(meta.id), String(meta.periodo_atual));
      return;
    }

    const storageKey = chavePeriodoVisto(meta.id);
    const periodoArmazenado = localStorage.getItem(storageKey);
    const periodoAtual = meta.periodo_atual;

    if (periodoArmazenado !== null) {
      const periodoAnterior = Number(periodoArmazenado);

      if (
        periodoAtual > periodoAnterior &&
        periodoAnterior > 0 &&
        !verificandoPeriodo.current
      ) {
        verificandoPeriodo.current = true;

        async function verificarMudancaPeriodo() {
          try {
            const response = await fetch(`/api/metas/${meta.id}/movimentacoes`);
            const movimentacoes = await response.json();

            if (!response.ok) return;

            const resumo = calcularMudancaPeriodo(
              meta,
              movimentacoes,
              periodoAnterior,
              periodoAtual
            );

            if (resumo) {
              setResumoMudancaPeriodo(resumo);
            }
          } finally {
            verificandoPeriodo.current = false;
          }
        }

        verificarMudancaPeriodo();
      }
    }

    localStorage.setItem(storageKey, String(periodoAtual));
  }, [
    meta,
    meta.id,
    meta.periodo_atual,
    meta.total_periodos,
    metaAtingida,
  ]);

  function handleMovimentacaoSuccess(tipo: "aporte" | "retirada") {
    setSuccessMessage(
      tipo === "aporte"
        ? "Aporte registrado com sucesso!"
        : "Retirada registrada com sucesso!"
    );
    setHighlightProgress(true);
    setHistoricoKey((current) => current + 1);
    setExpanded(true);
    setShowHistorico(true);
    setShowGrafico(true);
    router.refresh();

    setTimeout(() => setHighlightProgress(false), 1200);
  }

  function handleUndoSuccess() {
    setSuccessMessage("Última movimentação desfeita com sucesso!");
    setHistoricoKey((current) => current + 1);
    setShowGrafico(true);
    router.refresh();
  }

  async function handleDeleteMeta() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/metas/${meta.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? "Erro ao excluir meta.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Não foi possível excluir a meta.");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteMeta(false);
    }
  }

  return (
    <>
      <article className="border-b border-border bg-surface last:border-b-0">
        <div className="relative">
          <div className="absolute right-3 top-3 z-10">
            {confirmDeleteMeta ? (
              <div className="border border-red-200 bg-red-50 p-2 text-right shadow-sm dark:border-red-900 dark:bg-red-950/40">
                <p className="text-xs text-red-900 dark:text-red-300">
                  Excluir meta?
                </p>
                <div className="mt-1.5 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={handleDeleteMeta}
                    disabled={isDeleting}
                    className="border border-red-600 bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "..." : "Sim"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteMeta(false)}
                    disabled={isDeleting}
                    className="border border-border-strong px-2 py-0.5 text-[10px] font-medium text-foreground transition hover:bg-muted"
                  >
                    Não
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteMeta(true)}
                title="Excluir meta"
                className="border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                Excluir
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex w-full flex-col gap-4 px-5 py-4 pr-16 text-left transition hover:bg-muted"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {meta.nome}
                  </h3>
                  {metaAtingida && (
                    <span className="border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Concluída
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(meta.valor_objetivo)} até{" "}
                  {formatDate(meta.data_limite)} ·{" "}
                  {(meta.taxa_rendimento_anual * 100).toFixed(2)}% a.a.
                </p>
              </div>
              <span
                className="shrink-0 text-xs text-muted-foreground"
                aria-hidden="true"
              >
                {expanded ? "▲" : "▼"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 border border-border bg-muted p-4 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Saldo no dia {formatDate(meta.data_saldo)}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                  {formatCurrency(meta.saldo_atual)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {labelFaltaPeriodo}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300 sm:text-2xl">
                  {metaAtingida
                    ? "Meta atingida!"
                    : formatCurrency(meta.falta_no_periodo)}
                </p>
              </div>
            </div>
          </button>
        </div>

        {expanded && (
          <div className="border-t border-border px-5 py-5">
            <div className="mb-4">
              <ProgressBar
                percentual={meta.progresso_percentual}
                highlight={highlightProgress}
              />
            </div>

            {successMessage && (
              <div className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Objetivo</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatCurrency(meta.valor_objetivo)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Aportado</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatCurrency(meta.total_aportado)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rendimento</dt>
                <dd
                  className={`mt-1 font-medium ${
                    meta.rendimento_acumulado >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {meta.rendimento_acumulado >= 0 ? "+ " : "- "}
                  {formatCurrency(Math.abs(meta.rendimento_acumulado))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Falta</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatCurrency(meta.valor_restante)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Parcela prevista</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {metaAtingida
                    ? "—"
                    : formatCurrency(meta.valor_parcela_periodo)}
                </dd>
              </div>
              {!metaAtingida && (
                <div>
                  <dt className="text-muted-foreground">Líquido no período</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {formatCurrency(meta.aportado_no_periodo)}
                  </dd>
                </div>
              )}
            </dl>

            {meta.total_periodos > 0 && (
              <div className="mt-5 border border-border px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Período {meta.periodo_atual} de {meta.total_periodos}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(meta.periodo_inicio)} —{" "}
                  {formatDate(meta.periodo_fim)}
                </p>
                {!metaAtingida && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    Faltam {formatCurrency(meta.falta_periodo_calendario)} neste
                    período
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setModalTipo("aporte")}
                disabled={metaAtingida}
                className={`flex-1 ${btnEmeraldClass}`}
              >
                Registrar aporte
              </button>
              <button
                type="button"
                onClick={() => setModalTipo("retirada")}
                disabled={meta.saldo_atual <= 0}
                className={`flex-1 ${btnRedClass}`}
              >
                Registrar retirada
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowGrafico((current) => !current)}
                className="flex-1 border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {showGrafico ? "Ocultar gráfico" : "Ver gráfico"}
              </button>
              <button
                type="button"
                onClick={() => setShowHistorico((current) => !current)}
                className="flex-1 border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {showHistorico ? "Ocultar histórico" : "Ver histórico"}
              </button>
            </div>

            {showHistorico && (
              <div className="mt-5">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Histórico de movimentações
                </h4>
                <MovimentacoesHistorico
                  key={historicoKey}
                  meta={meta}
                  onUndoSuccess={handleUndoSuccess}
                />
              </div>
            )}

            {showGrafico && (
              <div className="mt-5">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Evolução do saldo
                </h4>
                <MetaEvolucaoGrafico key={historicoKey} meta={meta} />
              </div>
            )}
          </div>
        )}
      </article>

      {modalTipo && (
        <MovimentacaoModal
          metaId={meta.id}
          metaNome={meta.nome}
          dataInicio={dataCriacaoMeta(meta)}
          dataLimite={meta.data_limite}
          saldoAtual={meta.saldo_atual}
          tipo={modalTipo}
          isOpen={Boolean(modalTipo)}
          onClose={() => setModalTipo(null)}
          onSuccess={() => handleMovimentacaoSuccess(modalTipo)}
        />
      )}

      {resumoMudancaPeriodo && (
        <PeriodoMudouModal
          metaNome={meta.nome}
          resumo={resumoMudancaPeriodo}
          isOpen={Boolean(resumoMudancaPeriodo)}
          onClose={() => setResumoMudancaPeriodo(null)}
        />
      )}

      <MetaConcluidaModal
        metaNome={meta.nome}
        valorObjetivo={meta.valor_objetivo}
        saldoAtual={meta.saldo_atual}
        rendimentoAcumulado={meta.rendimento_acumulado}
        isOpen={showMetaConcluida}
        onClose={handleFecharMetaConcluida}
      />
    </>
  );
}
