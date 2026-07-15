import {
  arredondarMoeda,
  calcularSaldoComRendimento,
  dataCriacaoMeta,
  gerarPeriodosMeta,
} from "@/lib/calculations/juros-compostos";
import { formatDateLocal } from "@/lib/calculations/data-referencia";
import { getMetaById } from "@/lib/services/metas";
import { listMovimentacoesByMetaIds } from "@/lib/services/movimentacoes";
import type { Meta, TipoMovimentacao } from "@/types/database";

const TOLERANCIA_SALDO = 0.01;

type MovimentacaoInput = {
  meta_id?: unknown;
  valor?: unknown;
  descricao?: unknown;
  data?: unknown;
  tipo?: unknown;
};

type ValidationResult =
  | {
      success: true;
      data: {
        meta_id: string;
        valor: number;
        tipo: TipoMovimentacao;
        descricao: string | null;
        data: string;
      };
    }
  | { success: false; error: string };

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseTipo(value: unknown): TipoMovimentacao {
  return value === "retirada" ? "retirada" : "aporte";
}

export function validateMovimentacaoInput(
  input: MovimentacaoInput,
  metaIdFromRoute?: string
): ValidationResult {
  const metaId =
    metaIdFromRoute ??
    (typeof input.meta_id === "string" ? input.meta_id.trim() : "");

  if (!metaId || !isValidUuid(metaId)) {
    return { success: false, error: "ID da meta inválido." };
  }

  const valor = Number(input.valor);

  if (!Number.isFinite(valor) || valor <= 0) {
    return { success: false, error: "Valor deve ser maior que zero." };
  }

  const tipo = parseTipo(input.tipo);

  const descricao =
    input.descricao === undefined || input.descricao === null
      ? null
      : typeof input.descricao === "string"
        ? input.descricao.trim() || null
        : null;

  const data =
    input.data === undefined
      ? formatDateLocal()
      : typeof input.data === "string"
        ? input.data.trim()
        : "";

  if (!isValidDate(data)) {
    return { success: false, error: "Data inválida. Use o formato YYYY-MM-DD." };
  }

  return {
    success: true,
    data: {
      meta_id: metaId,
      valor,
      tipo,
      descricao,
      data,
    },
  };
}

export function validateDataDentroIntervaloMeta(
  meta: Meta,
  data: string
): { success: true } | { success: false; error: string } {
  const dataInicio = dataCriacaoMeta(meta);
  const dataFim = meta.data_limite;

  if (data < dataInicio) {
    return {
      success: false,
      error: `A data não pode ser anterior à criação da meta (${formatarDataBr(dataInicio)}).`,
    };
  }

  if (data > dataFim) {
    return {
      success: false,
      error: `A data não pode ser posterior à data limite da meta (${formatarDataBr(dataFim)}).`,
    };
  }

  return { success: true };
}

function formatarDataBr(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export async function validateDataMovimentacaoNaMeta(
  metaId: string,
  data: string
): Promise<{ success: true } | { success: false; error: string }> {
  const meta = await getMetaById(metaId);

  if (!meta) {
    return { success: false, error: "Meta não encontrada." };
  }

  return validateDataDentroIntervaloMeta(meta, data);
}

export function validateValorContraSaldo(
  saldoDisponivel: number,
  valorRetirada: number
): { success: true } | { success: false; error: string } {
  const saldo = arredondarMoeda(Math.max(saldoDisponivel, 0));

  if (valorRetirada > saldo + TOLERANCIA_SALDO) {
    const saldoFormatado = saldo.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return {
      success: false,
      error: `Saldo insuficiente. Disponível: ${saldoFormatado}.`,
    };
  }

  return { success: true };
}

export async function validateSaldoRetirada(
  metaId: string,
  valorRetirada: number,
  dataRetirada: string
): Promise<{ success: true } | { success: false; error: string }> {
  const meta = await getMetaById(metaId);

  if (!meta) {
    return { success: false, error: "Meta não encontrada." };
  }

  const movimentacoesPorMeta = await listMovimentacoesByMetaIds([metaId]);
  const movimentacoes = movimentacoesPorMeta[metaId] ?? [];
  const periodos = gerarPeriodosMeta(meta);
  const saldoDisponivel = calcularSaldoComRendimento(
    movimentacoes,
    meta.taxa_rendimento_anual,
    periodos,
    dataRetirada
  );

  return validateValorContraSaldo(saldoDisponivel, valorRetirada);
}
