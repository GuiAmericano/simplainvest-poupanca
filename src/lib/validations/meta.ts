type MetaInput = {
  nome?: unknown;
  valor_objetivo?: unknown;
  data_limite?: unknown;
};

type ValidationResult =
  | { success: true; data: { nome: string; valor_objetivo: number; data_limite: string } }
  | { success: false; error: string };

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function validateMetaInput(input: MetaInput): ValidationResult {
  const nome = typeof input.nome === "string" ? input.nome.trim() : "";

  if (!nome) {
    return { success: false, error: "Nome da meta é obrigatório." };
  }

  const valorObjetivo = Number(input.valor_objetivo);

  if (!Number.isFinite(valorObjetivo) || valorObjetivo <= 0) {
    return { success: false, error: "Valor objetivo deve ser maior que zero." };
  }

  const dataLimite =
    typeof input.data_limite === "string" ? input.data_limite.trim() : "";

  if (!isValidDate(dataLimite)) {
    return { success: false, error: "Data limite inválida. Use o formato YYYY-MM-DD." };
  }

  return {
    success: true,
    data: {
      nome,
      valor_objetivo: valorObjetivo,
      data_limite: dataLimite,
    },
  };
}

export function validateMetaUpdate(input: MetaInput): ValidationResult {
  const hasAnyField =
    input.nome !== undefined ||
    input.valor_objetivo !== undefined ||
    input.data_limite !== undefined;

  if (!hasAnyField) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }

  const nome =
    input.nome === undefined
      ? "placeholder"
      : typeof input.nome === "string"
        ? input.nome.trim()
        : "";

  if (input.nome !== undefined && !nome) {
    return { success: false, error: "Nome da meta não pode ser vazio." };
  }

  const valorObjetivo =
    input.valor_objetivo === undefined ? 1 : Number(input.valor_objetivo);

  if (
    input.valor_objetivo !== undefined &&
    (!Number.isFinite(valorObjetivo) || valorObjetivo <= 0)
  ) {
    return { success: false, error: "Valor objetivo deve ser maior que zero." };
  }

  const dataLimite =
    input.data_limite === undefined
      ? "2099-12-31"
      : typeof input.data_limite === "string"
        ? input.data_limite.trim()
        : "";

  if (input.data_limite !== undefined && !isValidDate(dataLimite)) {
    return { success: false, error: "Data limite inválida. Use o formato YYYY-MM-DD." };
  }

  return {
    success: true,
    data: {
      nome: input.nome === undefined ? "" : nome,
      valor_objetivo: input.valor_objetivo === undefined ? 0 : valorObjetivo,
      data_limite: input.data_limite === undefined ? "" : dataLimite,
    },
  };
}
