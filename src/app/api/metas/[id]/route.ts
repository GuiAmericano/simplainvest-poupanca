import {
  deleteMeta,
  updateMeta,
} from "@/lib/services/metas";
import { getMetaComProgressoById } from "@/lib/services/meta-progresso";
import { jsonData, jsonError } from "@/lib/utils/api-error";
import { validateMetaUpdate } from "@/lib/validations/meta";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meta = await getMetaComProgressoById(id);

    if (!meta) {
      return jsonError("Meta não encontrada.", 404);
    }

    return jsonData(meta);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar meta.";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = validateMetaUpdate(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const updateData: Partial<{
      nome: string;
      valor_objetivo: number;
      data_limite: string;
    }> = {};

    if (body.nome !== undefined) updateData.nome = validation.data.nome;
    if (body.valor_objetivo !== undefined) {
      updateData.valor_objetivo = validation.data.valor_objetivo;
    }
    if (body.data_limite !== undefined) {
      updateData.data_limite = validation.data.data_limite;
    }

    const meta = await updateMeta(id, updateData);

    if (!meta) {
      return jsonError("Meta não encontrada.", 404);
    }

    const metaComProgresso = await getMetaComProgressoById(id);
    return jsonData(metaComProgresso);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar meta.";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteMeta(id);

    if (!deleted) {
      return jsonError("Meta não encontrada.", 404);
    }

    return jsonData({ message: "Meta excluída com sucesso." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir meta.";
    return jsonError(message, 500);
  }
}
