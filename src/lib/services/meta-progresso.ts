import { calcularProgresso } from "@/lib/calculations/meta-progresso";
import { getMetaById, listMetas } from "@/lib/services/metas";
import {
  getTotalAportadoByMeta,
  getTotaisAportadosPorMetas,
} from "@/lib/services/movimentacoes";
import type { MetaComProgresso } from "@/types/database";

export async function listMetasComProgresso(): Promise<MetaComProgresso[]> {
  const metas = await listMetas();
  const metaIds = metas.map((meta) => meta.id);
  const totais = await getTotaisAportadosPorMetas(metaIds);

  return metas.map((meta) =>
    calcularProgresso(meta, totais[meta.id] ?? 0)
  );
}

export async function getMetaComProgressoById(
  id: string
): Promise<MetaComProgresso | null> {
  const meta = await getMetaById(id);

  if (!meta) return null;

  const totalAportado = await getTotalAportadoByMeta(id);
  return calcularProgresso(meta, totalAportado);
}
