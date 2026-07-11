import { createMeta } from "@/lib/services/metas";
import {
  getMetaComProgressoById,
  listMetasComProgresso,
} from "@/lib/services/meta-progresso";
import { jsonData, jsonError } from "@/lib/utils/api-error";
import { validateMetaInput } from "@/lib/validations/meta";

export async function GET() {
  try {
    const metas = await listMetasComProgresso();
    return jsonData(metas);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar metas.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateMetaInput(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const meta = await createMeta(validation.data);
    const metaComProgresso = await getMetaComProgressoById(meta.id);

    return jsonData(metaComProgresso, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar meta.";
    return jsonError(message, 500);
  }
}
