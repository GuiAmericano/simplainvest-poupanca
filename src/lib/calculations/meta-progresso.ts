import {
  arredondarMoeda,
  calcularAportadoNoPeriodo,
  calcularParcelaPeriodo,
  calcularSaldoComRendimento,
  calcularTotaisMovimentacoes,
  dataCriacaoMeta,
  gerarPeriodosMeta,
} from "@/lib/calculations/juros-compostos";
import {
  obterDataReferencia,
  obterDataSaldoExibicao,
} from "@/lib/calculations/data-referencia";
import { encontrarPeriodoAtual, type Periodo } from "@/lib/calculations/periodos";
import type { Meta, MetaComProgresso, Movimentacao } from "@/types/database";

const TOLERANCIA_META_ATINGIDA = 0.01;
const TOLERANCIA_PARCELA = 0.01;

function calcularFaltaNoPeriodo(
  meta: Meta,
  movimentacoes: Movimentacao[],
  periodos: Periodo[],
  periodo: Periodo,
  limiteData: string
): number {
  const parcela = calcularParcelaPeriodo(meta, movimentacoes, periodos, periodo);
  const aportado = calcularAportadoNoPeriodo(
    movimentacoes,
    periodo,
    limiteData
  );

  return arredondarMoeda(Math.max(parcela - aportado, 0));
}

export function calcularProgresso(
  meta: Meta,
  movimentacoes: Movimentacao[],
  referencia = new Date()
): MetaComProgresso {
  const periodos = gerarPeriodosMeta(meta);
  const dataReferencia = obterDataReferencia(movimentacoes, referencia);
  const dataSaldo = obterDataSaldoExibicao(movimentacoes, referencia);
  const periodoCalendario = encontrarPeriodoAtual(periodos, dataSaldo);

  const { totalAportado, totalRetirado } = calcularTotaisMovimentacoes(movimentacoes);
  const saldoAtual = calcularSaldoComRendimento(
    movimentacoes,
    meta.taxa_rendimento_anual,
    periodos,
    dataReferencia
  );

  const saldoLiquido = totalAportado - totalRetirado;
  const rendimentoAcumulado = arredondarMoeda(saldoAtual - saldoLiquido);
  const valorRestante = arredondarMoeda(Math.max(meta.valor_objetivo - saldoAtual, 0));

  const progressoPercentual =
    meta.valor_objetivo > 0
      ? Math.min((saldoAtual / meta.valor_objetivo) * 100, 100)
      : 0;

  const metaAtingida = saldoAtual >= meta.valor_objetivo - TOLERANCIA_META_ATINGIDA;

  if (!periodoCalendario || periodos.length === 0) {
    return {
      ...meta,
      data_saldo: dataSaldo,
      total_aportado: arredondarMoeda(totalAportado),
      total_retirado: arredondarMoeda(totalRetirado),
      saldo_atual: arredondarMoeda(saldoAtual),
      rendimento_acumulado: rendimentoAcumulado,
      valor_restante: metaAtingida ? 0 : valorRestante,
      progresso_percentual: arredondarMoeda(progressoPercentual),
      total_periodos: 0,
      periodo_atual: 0,
      periodo_inicio: dataCriacaoMeta(meta),
      periodo_fim: meta.data_limite,
      valor_parcela_periodo: 0,
      aportado_no_periodo: 0,
      falta_no_periodo: 0,
      falta_periodo_calendario: 0,
      falta_proximo_periodo: false,
    };
  }

  const valorParcelaCalendario = metaAtingida
    ? 0
    : arredondarMoeda(
        calcularParcelaPeriodo(meta, movimentacoes, periodos, periodoCalendario)
      );

  const aportadoNoPeriodo = arredondarMoeda(
    calcularAportadoNoPeriodo(movimentacoes, periodoCalendario, dataReferencia)
  );

  const faltaPeriodoCalendario = metaAtingida
    ? 0
    : calcularFaltaNoPeriodo(
        meta,
        movimentacoes,
        periodos,
        periodoCalendario,
        dataReferencia
      );

  const periodoCalendarioPago =
    !metaAtingida && faltaPeriodoCalendario <= TOLERANCIA_PARCELA;

  const proximoPeriodo = periodoCalendarioPago
    ? periodos[periodoCalendario.indice] ?? null
    : null;

  const faltaNoPeriodo = metaAtingida
    ? 0
    : proximoPeriodo
      ? calcularFaltaNoPeriodo(
          meta,
          movimentacoes,
          periodos,
          proximoPeriodo,
          dataReferencia
        )
      : faltaPeriodoCalendario;

  const faltaProximoPeriodo = periodoCalendarioPago && proximoPeriodo !== null;

  return {
    ...meta,
    data_saldo: dataSaldo,
    total_aportado: arredondarMoeda(totalAportado),
    total_retirado: arredondarMoeda(totalRetirado),
    saldo_atual: arredondarMoeda(saldoAtual),
    rendimento_acumulado: rendimentoAcumulado,
    valor_restante: metaAtingida ? 0 : valorRestante,
    progresso_percentual: arredondarMoeda(progressoPercentual),
    total_periodos: periodos.length,
    periodo_atual: periodoCalendario.indice,
    periodo_inicio: periodoCalendario.inicio,
    periodo_fim: periodoCalendario.fim,
    valor_parcela_periodo: valorParcelaCalendario,
    aportado_no_periodo: aportadoNoPeriodo,
    falta_no_periodo: faltaNoPeriodo,
    falta_periodo_calendario: faltaPeriodoCalendario,
    falta_proximo_periodo: faltaProximoPeriodo,
  };
}
