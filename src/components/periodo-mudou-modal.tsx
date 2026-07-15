"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import type { ResumoMudancaPeriodo } from "@/lib/calculations/mudanca-periodo";
import { useEffect } from "react";

type PeriodoMudouModalProps = {
  metaNome: string;
  resumo: ResumoMudancaPeriodo;
  isOpen: boolean;
  onClose: () => void;
};

export function PeriodoMudouModal({
  metaNome,
  resumo,
  isOpen,
  onClose,
}: PeriodoMudouModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/50 dark:bg-black/70"
      />

      <div className="relative w-full max-w-md border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">
          Período atualizado
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta: <span className="font-medium text-foreground">{metaNome}</span>
        </p>

        <div className="mt-5 space-y-4 text-sm text-foreground">
          <p>
            O período mudou de{" "}
            <span className="font-semibold">
              {resumo.periodo_anterior} ({formatDate(resumo.periodo_anterior_inicio)}{" "}
              — {formatDate(resumo.periodo_anterior_fim)})
            </span>{" "}
            para{" "}
            <span className="font-semibold">
              {resumo.periodo_novo} ({formatDate(resumo.periodo_novo_inicio)} —{" "}
              {formatDate(resumo.periodo_novo_fim)})
            </span>
            .
          </p>

          {resumo.reajustada && resumo.tipo_aporte === "acima" ? (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="font-medium text-emerald-900 dark:text-emerald-300">
                Parabéns!
              </p>
              <p className="mt-2 text-emerald-800 dark:text-emerald-200">
                Você aportou {formatCurrency(resumo.aportado_periodo_anterior)} no
                período anterior, acima da parcela prevista de{" "}
                {formatCurrency(resumo.parcela_esperada_anterior)}. Excelente
                disciplina! A parcela foi recalculada para{" "}
                <span className="font-semibold">
                  {formatCurrency(resumo.parcela_nova)}
                </span>
                .
              </p>
            </div>
          ) : resumo.reajustada && resumo.tipo_aporte === "abaixo" ? (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="font-medium text-amber-900 dark:text-amber-300">
                Parcela recalculada
              </p>
              <p className="mt-2 text-amber-800 dark:text-amber-200">
                Que pena! Os aportes do período anterior (
                {formatCurrency(resumo.aportado_periodo_anterior)}) ficaram abaixo
                da parcela prevista (
                {formatCurrency(resumo.parcela_esperada_anterior)}). A nova
                parcela prevista é{" "}
                <span className="font-semibold">
                  {formatCurrency(resumo.parcela_nova)}
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="font-medium text-emerald-900 dark:text-emerald-300">
                Parcela mantida
              </p>
              <p className="mt-2 text-emerald-800 dark:text-emerald-200">
                Os aportes do período anterior foram realizados corretamente. A
                parcela não foi recalculada. Parcela prevista:{" "}
                <span className="font-semibold">
                  {formatCurrency(resumo.parcela_nova)}
                </span>
                .
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
