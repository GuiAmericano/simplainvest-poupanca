import {
  arredondarMoeda,
  calcularAportadoNoPeriodo,
  calcularParcelaPeriodo,
  gerarPeriodosMeta,
} from "@/lib/calculations/juros-compostos";
import type { Meta, Movimentacao } from "@/types/database";

const TOLERANCIA_PARCELA = 0.01;

export type TipoAportePeriodo = "correto" | "acima" | "abaixo";

export type ResumoMudancaPeriodo = {
  periodo_anterior: number;
  periodo_novo: number;
  periodo_anterior_inicio: string;
  periodo_anterior_fim: string;
  periodo_novo_inicio: string;
  periodo_novo_fim: string;
  parcela_esperada_anterior: number;
  aportado_periodo_anterior: number;
  parcela_nova: number;
  reajustada: boolean;
  tipo_aporte: TipoAportePeriodo;
};

export function calcularMudancaPeriodo(
  meta: Meta,
  movimentacoes: Movimentacao[],
  periodoAnterior: number,
  periodoNovo: number
): ResumoMudancaPeriodo | null {
  if (periodoNovo <= periodoAnterior || periodoAnterior < 1) return null;

  const periodos = gerarPeriodosMeta(meta);
  const periodoAnt = periodos.find((p) => p.indice === periodoAnterior);
  const periodoNov = periodos.find((p) => p.indice === periodoNovo);

  if (!periodoAnt || !periodoNov) return null;

  const parcelaEsperada = arredondarMoeda(
    calcularParcelaPeriodo(meta, movimentacoes, periodos, periodoAnt)
  );

  const aportado = arredondarMoeda(
    calcularAportadoNoPeriodo(movimentacoes, periodoAnt, periodoAnt.fim)
  );

  const parcelaNova = arredondarMoeda(
    calcularParcelaPeriodo(meta, movimentacoes, periodos, periodoNov)
  );

  const reajustada =
    Math.abs(aportado - parcelaEsperada) > TOLERANCIA_PARCELA;

  let tipoAporte: TipoAportePeriodo = "correto";
  if (aportado > parcelaEsperada + TOLERANCIA_PARCELA) {
    tipoAporte = "acima";
  } else if (aportado < parcelaEsperada - TOLERANCIA_PARCELA) {
    tipoAporte = "abaixo";
  }

  return {
    periodo_anterior: periodoAnterior,
    periodo_novo: periodoNovo,
    periodo_anterior_inicio: periodoAnt.inicio,
    periodo_anterior_fim: periodoAnt.fim,
    periodo_novo_inicio: periodoNov.inicio,
    periodo_novo_fim: periodoNov.fim,
    parcela_esperada_anterior: parcelaEsperada,
    aportado_periodo_anterior: aportado,
    parcela_nova: parcelaNova,
    reajustada,
    tipo_aporte: tipoAporte,
  };
}

export function chavePeriodoVisto(metaId: string): string {
  return `meta-${metaId}-periodo-visto`;
}
