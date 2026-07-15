import { revalidatePath } from "next/cache";
import {
  deleteMovimentacao,
  getMovimentacaoById,
} from "@/lib/services/movimentacoes";
import { jsonData, jsonError } from "@/lib/utils/api-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const movimentacao = await getMovimentacaoById(id);

    if (!movimentacao) {
      return jsonError("Movimentação não encontrada.", 404);
    }

    return jsonData(movimentacao);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao buscar movimentação.";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteMovimentacao(id);

    if (!deleted) {
      return jsonError("Movimentação não encontrada.", 404);
    }

    revalidatePath("/");

    return jsonData({ message: "Movimentação excluída com sucesso." });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao excluir movimentação.";
    return jsonError(message, 500);
  }
}
