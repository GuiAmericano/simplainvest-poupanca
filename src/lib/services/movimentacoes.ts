import { createServerClient } from "@/lib/supabase/server";
import { mapMovimentacao, parseNumber } from "@/lib/utils/parse";
import type { Movimentacao } from "@/types/database";

export async function getTotalAportadoByMeta(metaId: string): Promise<number> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("movimentacoes")
    .select("valor")
    .eq("meta_id", metaId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((sum, row) => sum + parseNumber(row.valor), 0);
}

export async function getTotaisAportadosPorMetas(
  metaIds: string[]
): Promise<Record<string, number>> {
  if (metaIds.length === 0) return {};

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("movimentacoes")
    .select("meta_id, valor")
    .in("meta_id", metaIds);

  if (error) throw new Error(error.message);

  const totais: Record<string, number> = {};

  for (const id of metaIds) {
    totais[id] = 0;
  }

  for (const row of data ?? []) {
    const metaId = String(row.meta_id);
    totais[metaId] = (totais[metaId] ?? 0) + parseNumber(row.valor);
  }

  return totais;
}

export async function listMovimentacoesByMeta(
  metaId: string
): Promise<Movimentacao[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*")
    .eq("meta_id", metaId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapMovimentacao);
}

export async function getMovimentacaoById(
  id: string
): Promise<Movimentacao | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data ? mapMovimentacao(data) : null;
}

export async function createMovimentacao(input: {
  meta_id: string;
  valor: number;
  descricao: string | null;
  data: string;
}): Promise<Movimentacao> {
  const supabase = createServerClient();

  const { data: meta, error: metaError } = await supabase
    .from("metas")
    .select("id")
    .eq("id", input.meta_id)
    .maybeSingle();

  if (metaError) throw new Error(metaError.message);

  if (!meta) {
    throw new Error("Meta não encontrada.");
  }

  const { data, error } = await supabase
    .from("movimentacoes")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return mapMovimentacao(data);
}

export async function deleteMovimentacao(id: string): Promise<boolean> {
  const supabase = createServerClient();

  const { error, count } = await supabase
    .from("movimentacoes")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  return (count ?? 0) > 0;
}
