import { createServerClient } from "@/lib/supabase/server";
import { mapMeta } from "@/lib/utils/parse";
import type { Meta } from "@/types/database";

export async function listMetas(): Promise<Meta[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("metas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapMeta);
}

export async function getMetaById(id: string): Promise<Meta | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("metas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data ? mapMeta(data) : null;
}

export async function createMeta(input: {
  nome: string;
  valor_objetivo: number;
  data_limite: string;
  taxa_rendimento_anual: number;
}): Promise<Meta> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("metas")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return mapMeta(data);
}

export async function updateMeta(
  id: string,
  input: Partial<{
    nome: string;
    valor_objetivo: number;
    data_limite: string;
    taxa_rendimento_anual: number;
  }>
): Promise<Meta | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("metas")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data ? mapMeta(data) : null;
}

export async function deleteMeta(id: string): Promise<boolean> {
  const supabase = createServerClient();

  const { error, count } = await supabase
    .from("metas")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  return (count ?? 0) > 0;
}
