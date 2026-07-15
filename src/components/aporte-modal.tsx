"use client";

import { formatCurrency } from "@/lib/format";
import type { TipoMovimentacao } from "@/types/database";
import { FormEvent, useEffect, useState } from "react";

type MovimentacaoModalProps = {
  metaId: string;
  metaNome: string;
  dataInicio: string;
  dataLimite: string;
  saldoAtual?: number;
  tipo: TipoMovimentacao;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormErrors = {
  valor?: string;
  data?: string;
  geral?: string;
};

function formatDateLocal(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampDataNoIntervalo(
  data: string,
  dataInicio: string,
  dataLimite: string
): string {
  if (data < dataInicio) return dataInicio;
  if (data > dataLimite) return dataLimite;
  return data;
}

function validateForm(data: {
  valor: string;
  data: string;
  dataInicio: string;
  dataLimite: string;
  tipo: TipoMovimentacao;
  saldoAtual?: number;
}): FormErrors {
  const errors: FormErrors = {};
  const valor = Number(data.valor);

  if (!data.valor || !Number.isFinite(valor) || valor <= 0) {
    errors.valor = "Informe um valor maior que zero.";
  } else if (
    data.tipo === "retirada" &&
    data.saldoAtual !== undefined &&
    valor > data.saldoAtual + 0.01
  ) {
    errors.valor = `O valor não pode ser maior que o saldo disponível (${formatCurrency(data.saldoAtual)}).`;
  }

  if (!data.data) {
    errors.data = "Data é obrigatória.";
  } else if (Number.isNaN(Date.parse(data.data))) {
    errors.data = "Data inválida.";
  } else if (data.data < data.dataInicio) {
    errors.data = "A data não pode ser anterior à criação da meta.";
  } else if (data.data > data.dataLimite) {
    errors.data = "A data não pode ser posterior à data limite da meta.";
  }

  return errors;
}

const labels = {
  aporte: {
    titulo: "Registrar aporte",
    valor: "Valor do aporte (R$)",
    registrar: "Registrar aporte",
    acao: "registrar",
  },
  retirada: {
    titulo: "Registrar retirada",
    valor: "Valor da retirada (R$)",
    registrar: "Registrar retirada",
    acao: "retirar",
  },
} as const;

const inputClassName =
  "mt-1 w-full border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30";

export function MovimentacaoModal({
  metaId,
  metaNome,
  dataInicio,
  dataLimite,
  saldoAtual,
  tipo,
  isOpen,
  onClose,
  onSuccess,
}: MovimentacaoModalProps) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(() =>
    clampDataNoIntervalo(formatDateLocal(), dataInicio, dataLimite)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textos = labels[tipo];

  useEffect(() => {
    if (!isOpen) return;

    setData(clampDataNoIntervalo(formatDateLocal(), dataInicio, dataLimite));

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, dataInicio, dataLimite]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm({
      valor,
      data,
      dataInicio,
      dataLimite,
      tipo,
      saldoAtual,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/metas/${metaId}/movimentacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: Number(valor),
          tipo,
          descricao: descricao.trim() || null,
          data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setErrors({
          geral: responseData.error ?? `Erro ao registrar ${tipo}.`,
        });
        return;
      }

      setValor("");
      setDescricao("");
      setData(clampDataNoIntervalo(formatDateLocal(), dataInicio, dataLimite));
      onSuccess();
      onClose();
    } catch {
      setErrors({ geral: "Não foi possível conectar ao servidor." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/50 dark:bg-black/70"
      />

      <div className="relative w-full max-w-md border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">{textos.titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta: <span className="font-medium text-foreground">{metaNome}</span>
        </p>
        {tipo === "retirada" && saldoAtual !== undefined && (
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo disponível:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(saldoAtual)}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor={`valor-${tipo}-${metaId}`}
              className="text-sm font-medium text-foreground"
            >
              {textos.valor}
            </label>
            <input
              id={`valor-${tipo}-${metaId}`}
              type="number"
              min="0.01"
              max={tipo === "retirada" && saldoAtual ? saldoAtual : undefined}
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="500"
              className={inputClassName}
            />
            {errors.valor && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.valor}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`descricao-${tipo}-${metaId}`}
              className="text-sm font-medium text-foreground"
            >
              Descrição (opcional)
            </label>
            <input
              id={`descricao-${tipo}-${metaId}`}
              type="text"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder={
                tipo === "aporte" ? "Ex.: Salário de março" : "Ex.: Emergência"
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor={`data-${tipo}-${metaId}`}
              className="text-sm font-medium text-foreground"
            >
              Data
            </label>
            <input
              id={`data-${tipo}-${metaId}`}
              type="date"
              min={dataInicio}
              max={dataLimite}
              value={data}
              onChange={(event) => setData(event.target.value)}
              className={inputClassName}
            />
            {errors.data && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.data}
              </p>
            )}
          </div>

          {errors.geral && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.geral}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 border px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                tipo === "aporte"
                  ? "border-emerald-600 bg-emerald-600 hover:bg-emerald-700"
                  : "border-red-600 bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>

        {valor && Number(valor) > 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Você vai {textos.acao}{" "}
            <span
              className={`font-semibold ${
                tipo === "aporte"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatCurrency(Number(valor))}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export { MovimentacaoModal as AporteModal };
