"use client";

import { calcularDetalhesHistorico } from "@/lib/calculations/detalhes-movimentacao";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MetaComProgresso, Movimentacao } from "@/types/database";
import { useEffect, useMemo, useState } from "react";

type MovimentacoesHistoricoProps = {
  meta: MetaComProgresso;
  onUndoSuccess?: () => void;
};

export function MovimentacoesHistorico({
  meta,
  onUndoSuccess,
}: MovimentacoesHistoricoProps) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const ultimaMovimentacao = movimentacoes[0] ?? null;

  const detalhesMap = useMemo(
    () => calcularDetalhesHistorico(meta, movimentacoes),
    [meta, movimentacoes]
  );

  useEffect(() => {
    let active = true;

    async function loadMovimentacoes() {
      try {
        const response = await fetch(`/api/metas/${meta.id}/movimentacoes`);
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          setError(data.error ?? "Erro ao carregar histórico.");
          return;
        }

        setMovimentacoes(data);
      } catch {
        if (!active) return;
        setError("Não foi possível carregar o histórico.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    setIsLoading(true);
    setError(null);
    loadMovimentacoes();

    return () => {
      active = false;
    };
  }, [meta.id]);

  async function handleUndoMovimentacao() {
    if (!ultimaMovimentacao) return;

    setIsUndoing(true);
    setUndoError(null);

    try {
      const response = await fetch(
        `/api/movimentacoes/${ultimaMovimentacao.id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        setUndoError(data.error ?? "Erro ao desfazer movimentação.");
        return;
      }

      setConfirmUndo(false);
      onUndoSuccess?.();
    } catch {
      setUndoError("Não foi possível desfazer a movimentação.");
    } finally {
      setIsUndoing(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando histórico...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (movimentacoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma movimentação registrada ainda.
      </p>
    );
  }

  return (
    <div>
      {ultimaMovimentacao && (
        <div className="mb-3 flex items-center justify-end">
          {confirmUndo ? (
            <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-2 py-1 dark:border-amber-800 dark:bg-amber-950/30">
              <span className="text-[10px] text-amber-900 dark:text-amber-300">
                Desfazer{" "}
                {ultimaMovimentacao.tipo === "retirada" ? "retirada" : "aporte"}{" "}
                de {formatCurrency(ultimaMovimentacao.valor)}?
              </span>
              <button
                type="button"
                onClick={handleUndoMovimentacao}
                disabled={isUndoing}
                className="border border-amber-600 bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {isUndoing ? "..." : "Sim"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmUndo(false)}
                disabled={isUndoing}
                className="border border-border-strong px-1.5 py-0.5 text-[10px] font-medium text-foreground transition hover:bg-muted"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmUndo(true)}
              className="border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
            >
              Desfazer última
            </button>
          )}
        </div>
      )}

      {undoError && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">{undoError}</p>
      )}

      <ul className="flex flex-col gap-2">
        {movimentacoes.map((movimentacao) => {
          const isRetirada = movimentacao.tipo === "retirada";
          const isExpanded = expandedId === movimentacao.id;
          const detalhes = detalhesMap.get(movimentacao.id);

          return (
            <li
              key={movimentacao.id}
              className="border border-border bg-surface"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center text-base font-bold ${
                      isRetirada
                        ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                    }`}
                  >
                    {isRetirada ? "−" : "+"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isRetirada ? "Retirada" : "Aporte"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(movimentacao.data)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isRetirada
                      ? "text-red-700 dark:text-red-400"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {isRetirada ? "- " : "+ "}
                  {formatCurrency(movimentacao.valor)}
                </span>
              </div>

              {detalhes && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : movimentacao.id)
                    }
                    className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    <span>Detalhes</span>
                    <span aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3">
                      <p className="text-xs italic text-muted-foreground">
                        {detalhes.descricao_contextual}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Aportes líquidos
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {formatCurrency(detalhes.aportes_liquidos)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Juros do período
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {formatCurrency(detalhes.juros_periodo)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Juros acumulados
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {formatCurrency(detalhes.juros_acumulados)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Saldo após movimentação
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {formatCurrency(detalhes.saldo_apos_movimentacao)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
