import { listMetas, createMeta } from "@/lib/services/metas";
import { jsonData, jsonError } from "@/lib/utils/api-error";
import { validateMetaInput } from "@/lib/validations/meta";

export async function GET() {
  try {
    const metas = await listMetas();
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
    return jsonData(meta, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar meta.";
    return jsonError(message, 500);
  }
}
