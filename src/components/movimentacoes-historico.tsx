"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import type { Movimentacao } from "@/types/database";
import { useEffect, useState } from "react";

type MovimentacoesHistoricoProps = {
  metaId: string;
};

export function MovimentacoesHistorico({ metaId }: MovimentacoesHistoricoProps) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMovimentacoes() {
      try {
        const response = await fetch(`/api/metas/${metaId}/movimentacoes`);
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

    loadMovimentacoes();

    return () => {
      active = false;
    };
  }, [metaId]);

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Carregando histórico...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (movimentacoes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhum aporte registrado ainda. Registre o primeiro abaixo.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
      {movimentacoes.map((movimentacao) => (
        <li
          key={movimentacao.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {movimentacao.descricao ?? "Aporte"}
            </p>
            <p className="text-xs text-zinc-500">
              {formatDate(movimentacao.data)}
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-700">
            + {formatCurrency(movimentacao.valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}
