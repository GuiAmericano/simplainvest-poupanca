import { calcularProgresso } from "@/lib/calculations/meta-progresso";
import { getMetaById, listMetas } from "@/lib/services/metas";
import { listMovimentacoesByMetaIds } from "@/lib/services/movimentacoes";
import type { MetaComProgresso, Movimentacao } from "@/types/database";

export async function listMetasComProgresso(): Promise<MetaComProgresso[]> {
  const metas = await listMetas();
  const metaIds = metas.map((meta) => meta.id);
  const movimentacoesPorMeta = await listMovimentacoesByMetaIds(metaIds);

  return metas.map((meta) =>
    calcularProgresso(meta, movimentacoesPorMeta[meta.id] ?? [])
  );
}

export async function getMetaComProgressoById(
  id: string
): Promise<MetaComProgresso | null> {
  const meta = await getMetaById(id);

  if (!meta) return null;

  const movimentacoesPorMeta = await listMovimentacoesByMetaIds([id]);
  return calcularProgresso(meta, movimentacoesPorMeta[id] ?? []);
}

export function calcularProgressoComMovimentacoes(
  meta: NonNullable<Awaited<ReturnType<typeof getMetaById>>>,
  movimentacoes: Movimentacao[],
  referencia?: Date
) {
  return calcularProgresso(meta, movimentacoes, referencia);
}
