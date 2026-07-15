"use client";

import { btnEmeraldClass } from "@/lib/button-styles";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FormErrors = {
  nome?: string;
  valor_objetivo?: string;
  data_limite?: string;
  taxa_rendimento_anual?: string;
  geral?: string;
};

function validateForm(data: {
  nome: string;
  valor_objetivo: string;
  data_limite: string;
  taxa_rendimento_anual: string;
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

  const taxa =
    data.taxa_rendimento_anual.trim() === ""
      ? 0
      : Number(data.taxa_rendimento_anual);

  if (
    data.taxa_rendimento_anual.trim() !== "" &&
    (!Number.isFinite(taxa) || taxa < 0 || taxa > 100)
  ) {
    errors.taxa_rendimento_anual = "Informe uma taxa entre 0% e 100%.";
  }

  return errors;
}

const inputClassName =
  "mt-1 w-full border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30";

export function MetaForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [taxaRendimento, setTaxaRendimento] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm({
      nome,
      valor_objetivo: valorObjetivo,
      data_limite: dataLimite,
      taxa_rendimento_anual: taxaRendimento,
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
          taxa_rendimento_anual:
            taxaRendimento.trim() === "" ? 0 : Number(taxaRendimento),
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
      setTaxaRendimento("");
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
      className="border border-border bg-surface p-6"
    >
      <h2 className="text-lg font-semibold text-foreground">Nova meta</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Defina o objetivo, prazo e taxa de rendimento. A parcela mensal será
        calculada com juros compostos.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome" className="text-sm font-medium text-foreground">
            Nome da meta
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Viagem, carro, reserva de emergência"
            className={inputClassName}
          />
          {errors.nome && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.nome}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="valor_objetivo"
            className="text-sm font-medium text-foreground"
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
            className={inputClassName}
          />
          {errors.valor_objetivo && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.valor_objetivo}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="data_limite"
            className="text-sm font-medium text-foreground"
          >
            Data limite
          </label>
          <input
            id="data_limite"
            type="date"
            value={dataLimite}
            onChange={(event) => setDataLimite(event.target.value)}
            className={inputClassName}
          />
          {errors.data_limite && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.data_limite}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="taxa_rendimento_anual"
            className="text-sm font-medium text-foreground"
          >
            Taxa de rendimento anual (%)
          </label>
          <input
            id="taxa_rendimento_anual"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxaRendimento}
            onChange={(event) => setTaxaRendimento(event.target.value)}
            placeholder="10"
            className={inputClassName}
          />
          {errors.taxa_rendimento_anual && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.taxa_rendimento_anual}
            </p>
          )}
        </div>
      </div>

      {errors.geral && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {errors.geral}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-6 ${btnEmeraldClass}`}
      >
        {isSubmitting ? "Salvando..." : "Criar meta"}
      </button>
    </form>
  );
}
