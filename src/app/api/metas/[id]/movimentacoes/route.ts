import { revalidatePath } from "next/cache";
import {
  createMovimentacao,
  listMovimentacoesByMeta,
} from "@/lib/services/movimentacoes";
import { getMetaById } from "@/lib/services/metas";
import { jsonData, jsonError } from "@/lib/utils/api-error";
import {
  validateDataMovimentacaoNaMeta,
  validateMovimentacaoInput,
  validateSaldoRetirada,
} from "@/lib/validations/movimentacao";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meta = await getMetaById(id);

    if (!meta) {
      return jsonError("Meta não encontrada.", 404);
    }

    const movimentacoes = await listMovimentacoesByMeta(id);
    return jsonData(movimentacoes);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao listar movimentações.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = validateMovimentacaoInput(body, id);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const dataValidation = await validateDataMovimentacaoNaMeta(
      id,
      validation.data.data
    );

    if (!dataValidation.success) {
      return jsonError(dataValidation.error, 400);
    }

    if (validation.data.tipo === "retirada") {
      const saldoValidation = await validateSaldoRetirada(
        id,
        validation.data.valor,
        validation.data.data
      );

      if (!saldoValidation.success) {
        return jsonError(saldoValidation.error, 400);
      }
    }

    const movimentacao = await createMovimentacao(validation.data);
    revalidatePath("/");
    return jsonData(movimentacao, 201);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao registrar movimentação.";

    if (message === "Meta não encontrada.") {
      return jsonError(message, 404);
    }

    return jsonError(message, 500);
  }
}
