type MovimentacaoInput = {
  meta_id?: unknown;
  valor?: unknown;
  descricao?: unknown;
  data?: unknown;
};

type ValidationResult =
  | {
      success: true;
      data: {
        meta_id: string;
        valor: number;
        descricao: string | null;
        data: string;
      };
    }
  | { success: false; error: string };

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function validateMovimentacaoInput(
  input: MovimentacaoInput,
  metaIdFromRoute?: string
): ValidationResult {
  const metaId =
    metaIdFromRoute ??
    (typeof input.meta_id === "string" ? input.meta_id.trim() : "");

  if (!metaId || !isValidUuid(metaId)) {
    return { success: false, error: "ID da meta inválido." };
  }

  const valor = Number(input.valor);

  if (!Number.isFinite(valor) || valor <= 0) {
    return { success: false, error: "Valor do aporte deve ser maior que zero." };
  }

  const descricao =
    input.descricao === undefined || input.descricao === null
      ? null
      : typeof input.descricao === "string"
        ? input.descricao.trim() || null
        : null;

  const data =
    input.data === undefined
      ? new Date().toISOString().slice(0, 10)
      : typeof input.data === "string"
        ? input.data.trim()
        : "";

  if (!isValidDate(data)) {
    return { success: false, error: "Data inválida. Use o formato YYYY-MM-DD." };
  }

  return {
    success: true,
    data: {
      meta_id: metaId,
      valor,
      descricao,
      data,
    },
  };
}
