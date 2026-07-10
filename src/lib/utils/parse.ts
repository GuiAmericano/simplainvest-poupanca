import type { Meta, Movimentacao } from "@/types/database";

export function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

export function mapMeta(row: Record<string, unknown>): Meta {
  return {
    id: String(row.id),
    nome: String(row.nome),
    valor_objetivo: parseNumber(row.valor_objetivo),
    data_limite: String(row.data_limite),
    created_at: String(row.created_at),
  };
}

export function mapMovimentacao(row: Record<string, unknown>): Movimentacao {
  return {
    id: String(row.id),
    meta_id: String(row.meta_id),
    valor: parseNumber(row.valor),
    descricao: row.descricao ? String(row.descricao) : null,
    data: String(row.data),
    created_at: String(row.created_at),
  };
}
