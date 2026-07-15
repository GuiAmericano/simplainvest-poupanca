type MetaInput = {
  nome?: unknown;
  valor_objetivo?: unknown;
  data_limite?: unknown;
  taxa_rendimento_anual?: unknown;
};

type MetaValidated = {
  nome: string;
  valor_objetivo: number;
  data_limite: string;
  taxa_rendimento_anual: number;
};

type ValidationResult =
  | { success: true; data: MetaValidated }
  | { success: false; error: string };

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function parseTaxaRendimento(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const taxa = Number(value);

  if (!Number.isFinite(taxa) || taxa < 0 || taxa > 100) {
    return null;
  }

  return taxa / 100;
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

  const taxaRendimento = parseTaxaRendimento(input.taxa_rendimento_anual);

  if (taxaRendimento === null) {
    return {
      success: false,
      error: "Taxa de rendimento anual deve estar entre 0% e 100%.",
    };
  }

  return {
    success: true,
    data: {
      nome,
      valor_objetivo: valorObjetivo,
      data_limite: dataLimite,
      taxa_rendimento_anual: taxaRendimento,
    },
  };
}

export function validateMetaUpdate(input: MetaInput): ValidationResult {
  const hasAnyField =
    input.nome !== undefined ||
    input.valor_objetivo !== undefined ||
    input.data_limite !== undefined ||
    input.taxa_rendimento_anual !== undefined;

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

  let taxaRendimento = 0;

  if (input.taxa_rendimento_anual !== undefined) {
    const parsed = parseTaxaRendimento(input.taxa_rendimento_anual);

    if (parsed === null) {
      return {
        success: false,
        error: "Taxa de rendimento anual deve estar entre 0% e 100%.",
      };
    }

    taxaRendimento = parsed;
  }

  return {
    success: true,
    data: {
      nome: input.nome === undefined ? "" : nome,
      valor_objetivo: input.valor_objetivo === undefined ? 0 : valorObjetivo,
      data_limite: input.data_limite === undefined ? "" : dataLimite,
      taxa_rendimento_anual: taxaRendimento,
    },
  };
}
