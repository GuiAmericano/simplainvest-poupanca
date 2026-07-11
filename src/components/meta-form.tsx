"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FormErrors = {
  nome?: string;
  valor_objetivo?: string;
  data_limite?: string;
  geral?: string;
};

function validateForm(data: {
  nome: string;
  valor_objetivo: string;
  data_limite: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!data.nome.trim()) {
    errors.nome = "Nome da meta é obrigatório.";
  }

  const valor = Number(data.valor_objetivo);

  if (!data.valor_objetivo || !Number.isFinite(valor) || valor <= 0) {
    errors.valor_objetivo = "Informe um valor maior que zero.";
  }

  if (!data.data_limite) {
    errors.data_limite = "Data limite é obrigatória.";
  } else if (Number.isNaN(Date.parse(data.data_limite))) {
    errors.data_limite = "Data inválida.";
  }

  return errors;
}

export function MetaForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm({
      nome,
      valor_objetivo: valorObjetivo,
      data_limite: dataLimite,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          valor_objetivo: Number(valorObjetivo),
          data_limite: dataLimite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ geral: data.error ?? "Erro ao criar meta." });
        return;
      }

      setNome("");
      setValorObjetivo("");
      setDataLimite("");
      router.refresh();
    } catch {
      setErrors({ geral: "Não foi possível conectar ao servidor." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-900">Nova meta</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Defina o objetivo e o prazo para calcular quanto poupar por mês.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome" className="text-sm font-medium text-zinc-700">
            Nome da meta
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Viagem, carro, reserva de emergência"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          {errors.nome && (
            <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="valor_objetivo"
            className="text-sm font-medium text-zinc-700"
          >
            Valor objetivo (R$)
          </label>
          <input
            id="valor_objetivo"
            type="number"
            min="0.01"
            step="0.01"
            value={valorObjetivo}
            onChange={(event) => setValorObjetivo(event.target.value)}
            placeholder="15000"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          {errors.valor_objetivo && (
            <p className="mt-1 text-sm text-red-600">{errors.valor_objetivo}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="data_limite"
            className="text-sm font-medium text-zinc-700"
          >
            Data limite
          </label>
          <input
            id="data_limite"
            type="date"
            value={dataLimite}
            onChange={(event) => setDataLimite(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          {errors.data_limite && (
            <p className="mt-1 text-sm text-red-600">{errors.data_limite}</p>
          )}
        </div>
      </div>

      {errors.geral && (
        <p className="mt-4 text-sm text-red-600">{errors.geral}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Criar meta"}
      </button>
    </form>
  );
}
