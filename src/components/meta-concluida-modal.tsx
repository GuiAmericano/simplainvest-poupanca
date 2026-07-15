"use client";

import { formatCurrency } from "@/lib/format";
import { useEffect } from "react";

type MetaConcluidaModalProps = {
  metaNome: string;
  valorObjetivo: number;
  saldoAtual: number;
  rendimentoAcumulado: number;
  isOpen: boolean;
  onClose: () => void;
};

export function MetaConcluidaModal({
  metaNome,
  valorObjetivo,
  saldoAtual,
  rendimentoAcumulado,
  isOpen,
  onClose,
}: MetaConcluidaModalProps) {
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
          Meta atingida!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta: <span className="font-medium text-foreground">{metaNome}</span>
        </p>

        <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="font-medium text-emerald-900 dark:text-emerald-300">
            Parabéns!
          </p>
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
            Você atingiu o objetivo de{" "}
            <span className="font-semibold">
              {formatCurrency(valorObjetivo)}
            </span>
            . Seu saldo atual é{" "}
            <span className="font-semibold">{formatCurrency(saldoAtual)}</span>
            {rendimentoAcumulado > 0 && (
              <>
                , incluindo{" "}
                <span className="font-semibold">
                  {formatCurrency(rendimentoAcumulado)}
                </span>{" "}
                de rendimento
              </>
            )}
            .
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium !text-white transition hover:border-emerald-700 hover:bg-emerald-700 hover:!text-white dark:border-emerald-500 dark:bg-emerald-500 dark:hover:border-emerald-600 dark:hover:bg-emerald-600"
        >
          Celebrar!
        </button>
      </div>
    </div>
  );
}
