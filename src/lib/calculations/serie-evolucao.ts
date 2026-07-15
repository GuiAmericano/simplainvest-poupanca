import { formatDateLocal } from "@/lib/calculations/data-referencia";
import { calcularDetalhesMovimentacao } from "@/lib/calculations/detalhes-movimentacao";
import {
  arredondarMoeda,
  calcularPMT,
  calcularSaldoComRendimento,
  dataCriacaoMeta,
  gerarPeriodosMeta,
  taxaMensalEfetiva,
} from "@/lib/calculations/juros-compostos";
import type { Meta, MetaComProgresso, Movimentacao, TipoMovimentacao } from "@/types/database";

export type TipoPontoGrafico =
  | "inicio"
  | "movimentacao"
  | "periodo"
  | "atual"
  | "ideal";

export type PontoGraficoEvolucao = {
  data: string;
  timestamp: number;
  saldo: number | null;
  saldo_ideal: number | null;
  tipo: TipoPontoGrafico;
  movimentacao?: { tipo: TipoMovimentacao; valor: number };
};

export type DadosGraficoEvolucao = {
  data_inicio: string;
  data_fim: string;
  timestamp_inicio: number;
  timestamp_fim: number;
  pontos: PontoGraficoEvolucao[];
};

/** @deprecated Use PontoGraficoEvolucao via montarDadosGraficoEvolucao */
export type PontoEvolucao = {
  data: string;
  timestamp: number;
  saldo: number;
  objetivo: number;
  tipo: "inicio" | "movimentacao" | "atual";
  movimentacao?: { tipo: TipoMovimentacao; valor: number };
};

/** @deprecated Use DadosGraficoEvolucao */
export type SerieEvolucaoMeta = {
  data_inicio: string;
  data_fim: string;
  timestamp_inicio: number;
  timestamp_fim: number;
  pontos: PontoEvolucao[];
};

function dateToTimestamp(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

function movimentacaoToTimestamp(
  movimentacao: Movimentacao,
  indiceNoDia: number
): number {
  return dateToTimestamp(movimentacao.data) + indiceNoDia * 60_000;
}

function ordenarMovimentacoes(movimentacoes: Movimentacao[]): Movimentacao[] {
  return [...movimentacoes].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.created_at.localeCompare(b.created_at);
  });
}

type PontoSaldoReal = Omit<PontoGraficoEvolucao, "saldo_ideal"> & { saldo: number };

export function calcularSerieSaldoReal(
  meta: MetaComProgresso,
  movimentacoes: Movimentacao[],
  referencia = new Date()
): PontoSaldoReal[] {
  const dataInicio = dataCriacaoMeta(meta);
  const dataHoje = formatDateLocal(referencia);
  const metaAtingida = meta.progresso_percentual >= 100;
  const periodos = gerarPeriodosMeta(meta);

  const pontos: PontoSaldoReal[] = [
    {
      data: dataInicio,
      timestamp: dateToTimestamp(dataInicio),
      saldo: 0,
      tipo: "inicio",
    },
  ];

  const contagemPorData = new Map<string, number>();

  for (const movimentacao of ordenarMovimentacoes(movimentacoes)) {
    const detalhes = calcularDetalhesMovimentacao(
      meta,
      movimentacoes,
      movimentacao
    );

    const indiceNoDia = contagemPorData.get(movimentacao.data) ?? 0;
    contagemPorData.set(movimentacao.data, indiceNoDia + 1);

    pontos.push({
      data: movimentacao.data,
      timestamp: movimentacaoToTimestamp(movimentacao, indiceNoDia),
      saldo: detalhes.saldo_apos_movimentacao,
      tipo: "movimentacao",
      movimentacao: {
        tipo: movimentacao.tipo,
        valor: movimentacao.valor,
      },
    });
  }

  if (!metaAtingida) {
    const timestampHoje = dateToTimestamp(dataHoje);
    const ultimoPonto = pontos[pontos.length - 1];

    if (ultimoPonto.data !== dataHoje) {
      const saldoAtual = arredondarMoeda(
        calcularSaldoComRendimento(
          movimentacoes,
          meta.taxa_rendimento_anual,
          periodos,
          dataHoje
        )
      );

      pontos.push({
        data: dataHoje,
        timestamp: timestampHoje,
        saldo: saldoAtual,
        tipo: "atual",
      });
    }
  }

  return pontos.sort((a, b) => a.timestamp - b.timestamp);
}

export function calcularSerieProjecaoIdeal(meta: Meta): PontoGraficoEvolucao[] {
  const dataInicio = dataCriacaoMeta(meta);
  const periodos = gerarPeriodosMeta(meta);

  if (periodos.length === 0) {
    return [
      {
        data: dataInicio,
        timestamp: dateToTimestamp(dataInicio),
        saldo: null,
        saldo_ideal: 0,
        tipo: "inicio",
      },
    ];
  }

  const taxaMensal = taxaMensalEfetiva(meta.taxa_rendimento_anual);
  const parcelaIdeal = arredondarMoeda(
    calcularPMT(meta.valor_objetivo, periodos.length, taxaMensal)
  );

  const pontos: PontoGraficoEvolucao[] = [
    {
      data: dataInicio,
      timestamp: dateToTimestamp(dataInicio),
      saldo: null,
      saldo_ideal: 0,
      tipo: "inicio",
    },
  ];

  let saldo = 0;

  for (const periodo of periodos) {
    if (taxaMensal > 0) {
      saldo *= 1 + taxaMensal;
    }
    saldo += parcelaIdeal;

    pontos.push({
      data: periodo.fim,
      timestamp: dateToTimestamp(periodo.fim),
      saldo: null,
      saldo_ideal: arredondarMoeda(saldo),
      tipo: "ideal",
    });
  }

  return pontos;
}

export function montarDadosGraficoEvolucao(
  meta: MetaComProgresso,
  movimentacoes: Movimentacao[],
  referencia = new Date()
): DadosGraficoEvolucao {
  const dataInicio = dataCriacaoMeta(meta);
  const dataFim = meta.data_limite;
  const saldoReal = calcularSerieSaldoReal(meta, movimentacoes, referencia);
  const projecaoIdeal = calcularSerieProjecaoIdeal(meta);

  const pontosMap = new Map<number, PontoGraficoEvolucao>();

  for (const ponto of saldoReal) {
    pontosMap.set(ponto.timestamp, {
      ...ponto,
      saldo_ideal: null,
    });
  }

  for (const ponto of projecaoIdeal) {
    const existente = pontosMap.get(ponto.timestamp);

    if (existente) {
      existente.saldo_ideal = ponto.saldo_ideal;
    } else {
      pontosMap.set(ponto.timestamp, ponto);
    }
  }

  const pontos = Array.from(pontosMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return {
    data_inicio: dataInicio,
    data_fim: dataFim,
    timestamp_inicio: dateToTimestamp(dataInicio),
    timestamp_fim: dateToTimestamp(dataFim),
    pontos,
  };
}

/** @deprecated Use montarDadosGraficoEvolucao */
export function calcularSerieEvolucao(
  meta: MetaComProgresso,
  movimentacoes: Movimentacao[],
  referencia = new Date()
): SerieEvolucaoMeta {
  const dados = montarDadosGraficoEvolucao(meta, movimentacoes, referencia);
  const objetivo = meta.valor_objetivo;

  const pontos: PontoEvolucao[] = dados.pontos
    .filter((p) => p.saldo !== null)
    .map((p) => ({
      data: p.data,
      timestamp: p.timestamp,
      saldo: p.saldo as number,
      objetivo,
      tipo:
        p.tipo === "periodo" || p.tipo === "ideal"
          ? "atual"
          : (p.tipo as "inicio" | "movimentacao" | "atual"),
      movimentacao: p.movimentacao,
    }));

  return {
    data_inicio: dados.data_inicio,
    data_fim: dados.data_fim,
    timestamp_inicio: dados.timestamp_inicio,
    timestamp_fim: dados.timestamp_fim,
    pontos,
  };
}
