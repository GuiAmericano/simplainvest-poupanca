import {
  contarPeriodosRestantes,
  gerarPeriodos,
  isDataNoPeriodo,
  type Periodo,
} from "@/lib/calculations/periodos";
import { formatDateLocalFromIso } from "@/lib/calculations/data-referencia";
import type { Meta, Movimentacao } from "@/types/database";

export function taxaMensalEfetiva(taxaAnual: number): number {
  if (taxaAnual <= 0) return 0;
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

export function calcularPMT(fv: number, periodos: number, taxaMensal: number): number {
  if (periodos <= 0 || fv <= 0) return 0;

  if (taxaMensal <= 0) {
    return fv / periodos;
  }

  const fator = Math.pow(1 + taxaMensal, periodos);
  return (fv * taxaMensal) / (fator - 1);
}

function valorLiquidoMovimentacao(movimentacao: Movimentacao): number {
  return movimentacao.tipo === "retirada" ? -movimentacao.valor : movimentacao.valor;
}

export function calcularSaldoComRendimento(
  movimentacoes: Movimentacao[],
  taxaAnual: number,
  periodos: Periodo[],
  dataReferencia: string
): number {
  const taxaMensal = taxaMensalEfetiva(taxaAnual);
  let saldo = 0;

  for (const periodo of periodos) {
    if (periodo.inicio > dataReferencia) break;

    if (taxaMensal > 0) {
      saldo *= 1 + taxaMensal;
    }

    const limite = dataReferencia < periodo.fim ? dataReferencia : periodo.fim;

    for (const movimentacao of movimentacoes) {
      if (isDataNoPeriodo(movimentacao.data, periodo, limite)) {
        saldo += valorLiquidoMovimentacao(movimentacao);
      }
    }

    if (dataReferencia <= periodo.fim) break;
  }

  return Math.max(saldo, 0);
}

export function calcularTotaisMovimentacoes(movimentacoes: Movimentacao[]): {
  totalAportado: number;
  totalRetirado: number;
} {
  let totalAportado = 0;
  let totalRetirado = 0;

  for (const movimentacao of movimentacoes) {
    if (movimentacao.tipo === "retirada") {
      totalRetirado += movimentacao.valor;
    } else {
      totalAportado += movimentacao.valor;
    }
  }

  return { totalAportado, totalRetirado };
}

export function calcularAportadoNoPeriodo(
  movimentacoes: Movimentacao[],
  periodo: Periodo,
  ateData?: string
): number {
  let liquido = 0;

  for (const movimentacao of movimentacoes) {
    if (isDataNoPeriodo(movimentacao.data, periodo, ateData)) {
      liquido += valorLiquidoMovimentacao(movimentacao);
    }
  }

  return liquido;
}

export function calcularParcelaPeriodo(
  meta: Meta,
  movimentacoes: Movimentacao[],
  periodos: Periodo[],
  periodoAtual: Periodo
): number {
  const taxaMensal = taxaMensalEfetiva(meta.taxa_rendimento_anual);
  const periodosRestantes = contarPeriodosRestantes(periodos, periodoAtual);

  if (periodosRestantes <= 0) return 0;

  if (periodoAtual.indice === 1) {
    return calcularPMT(meta.valor_objetivo, periodos.length, taxaMensal);
  }

  const periodoAnterior = periodos[periodoAtual.indice - 2];
  const saldoInicioPeriodo = calcularSaldoComRendimento(
    movimentacoes,
    meta.taxa_rendimento_anual,
    periodos,
    periodoAnterior.fim
  );

  const fvSaldo = saldoInicioPeriodo * Math.pow(1 + taxaMensal, periodosRestantes);
  const gap = Math.max(meta.valor_objetivo - fvSaldo, 0);

  return calcularPMT(gap, periodosRestantes, taxaMensal);
}

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function dataCriacaoMeta(meta: Meta): string {
  return formatDateLocalFromIso(meta.created_at);
}

export function gerarPeriodosMeta(meta: Meta): Periodo[] {
  return gerarPeriodos(dataCriacaoMeta(meta), meta.data_limite);
}
