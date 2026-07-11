"use client";

import { formatCurrency } from "@/lib/format";
import { FormEvent, useEffect, useState } from "react";

type AporteModalProps = {
  metaId: string;
  metaNome: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormErrors = {
  valor?: string;
  data?: string;
  geral?: string;
};

function validateForm(data: { valor: string; data: string }): FormErrors {
  const errors: FormErrors = {};
  const valor = Number(data.valor);

  if (!data.valor || !Number.isFinite(valor) || valor <= 0) {
    errors.valor = "Informe um valor maior que zero.";
  }

  if (!data.data) {
    errors.data = "Data é obrigatória.";
  } else if (Number.isNaN(Date.parse(data.data))) {
    errors.data = "Data inválida.";
  }

  return errors;
}

export function AporteModal({
  metaId,
  metaNome,
  isOpen,
  onClose,
  onSuccess,
}: AporteModalProps) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm({ valor, data });

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
          descricao: descricao.trim() || null,
          data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setErrors({ geral: responseData.error ?? "Erro ao registrar aporte." });
        return;
      }

      setValor("");
      setDescricao("");
      setData(new Date().toISOString().slice(0, 10));
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
        className="absolute inset-0 bg-zinc-900/50"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">Registrar aporte</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Meta: <span className="font-medium text-zinc-700">{metaNome}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor={`valor-${metaId}`} className="text-sm font-medium text-zinc-700">
              Valor do aporte (R$)
            </label>
            <input
              id={`valor-${metaId}`}
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="500"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.valor && (
              <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
            )}
          </div>

          <div>
            <label
              htmlFor={`descricao-${metaId}`}
              className="text-sm font-medium text-zinc-700"
            >
              Descrição (opcional)
            </label>
            <input
              id={`descricao-${metaId}`}
              type="text"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Ex.: Salário de março"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor={`data-${metaId}`} className="text-sm font-medium text-zinc-700">
              Data do aporte
            </label>
            <input
              id={`data-${metaId}`}
              type="date"
              value={data}
              onChange={(event) => setData(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.data && (
              <p className="mt-1 text-sm text-red-600">{errors.data}</p>
            )}
          </div>

          {errors.geral && (
            <p className="text-sm text-red-600">{errors.geral}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>

        {valor && Number(valor) > 0 && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Você vai registrar{" "}
            <span className="font-semibold text-emerald-700">
              {formatCurrency(Number(valor))}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
