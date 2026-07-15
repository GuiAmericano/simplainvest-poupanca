import {
  arredondarMoeda,
  calcularAportadoNoPeriodo,
  calcularSaldoComRendimento,
  calcularTotaisMovimentacoes,
  gerarPeriodosMeta,
} from "@/lib/calculations/juros-compostos";
import { encontrarPeriodoAtual } from "@/lib/calculations/periodos";
import { formatCurrency } from "@/lib/format";
import type { Meta, Movimentacao } from "@/types/database";

export type DetalhesMovimentacao = {
  aportes_liquidos: number;
  juros_periodo: number;
  juros_acumulados: number;
  saldo_apos_movimentacao: number;
  descricao_contextual: string;
  periodo_indice: number;
};

function ordenarCronologicamente(movimentacoes: Movimentacao[]): Movimentacao[] {
  return [...movimentacoes].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.created_at.localeCompare(b.created_at);
  });
}

function movimentacoesAte(
  movimentacoes: Movimentacao[],
  movimentacaoAtual: Movimentacao
): Movimentacao[] {
  const ordenadas = ordenarCronologicamente(movimentacoes);
  const indice = ordenadas.findIndex((m) => m.id === movimentacaoAtual.id);

  if (indice === -1) return [];

  return ordenadas.slice(0, indice + 1);
}

function saldoFimPeriodoAnterior(
  meta: Meta,
  movimentacoes: Movimentacao[],
  taxaAnual: number,
  periodoIndice: number
): number {
  if (periodoIndice <= 1) return 0;

  const periodos = gerarPeriodosMeta(meta);
  const periodoAnterior = periodos[periodoIndice - 2];

  return arredondarMoeda(
    calcularSaldoComRendimento(
      movimentacoes,
      taxaAnual,
      periodos,
      periodoAnterior.fim
    )
  );
}

function gerarDescricaoContextual(
  movimentacao: Movimentacao,
  periodoIndice: number,
  jurosPeriodo: number
): string {
  if (movimentacao.tipo === "retirada") {
    return `Mês ${periodoIndice} do plano — retirada de ${formatCurrency(movimentacao.valor)} do saldo acumulado`;
  }

  if (jurosPeriodo <= 0) {
    return `Mês ${periodoIndice} do plano — sem juros neste mês (aporte recém-feito)`;
  }

  return `Mês ${periodoIndice} do plano — juros de ${formatCurrency(jurosPeriodo)} aplicados no início do período`;
}

export function calcularDetalhesMovimentacao(
  meta: Meta,
  todasMovimentacoes: Movimentacao[],
  movimentacaoAtual: Movimentacao
): DetalhesMovimentacao {
  const periodos = gerarPeriodosMeta(meta);
  const movsAteAqui = movimentacoesAte(todasMovimentacoes, movimentacaoAtual);

  const { totalAportado, totalRetirado } = calcularTotaisMovimentacoes(movsAteAqui);
  const aportesLiquidos = arredondarMoeda(totalAportado - totalRetirado);

  const saldoApos = arredondarMoeda(
    calcularSaldoComRendimento(
      movsAteAqui,
      meta.taxa_rendimento_anual,
      periodos,
      movimentacaoAtual.data
    )
  );

  const jurosAcumulados = arredondarMoeda(saldoApos - aportesLiquidos);

  const periodo = encontrarPeriodoAtual(periodos, movimentacaoAtual.data);
  const periodoIndice = periodo?.indice ?? 1;

  const saldoFimAnterior = saldoFimPeriodoAnterior(
    meta,
    movsAteAqui,
    meta.taxa_rendimento_anual,
    periodoIndice
  );

  const aportesLiquidosNoPeriodo = periodo
    ? arredondarMoeda(
        calcularAportadoNoPeriodo(
          movsAteAqui,
          periodo,
          movimentacaoAtual.data
        )
      )
    : 0;

  const jurosPeriodo = arredondarMoeda(
    saldoApos - aportesLiquidosNoPeriodo - saldoFimAnterior
  );

  return {
    aportes_liquidos: aportesLiquidos,
    juros_periodo: jurosPeriodo,
    juros_acumulados: jurosAcumulados,
    saldo_apos_movimentacao: saldoApos,
    descricao_contextual: gerarDescricaoContextual(
      movimentacaoAtual,
      periodoIndice,
      jurosPeriodo
    ),
    periodo_indice: periodoIndice,
  };
}

export function calcularDetalhesHistorico(
  meta: Meta,
  movimentacoes: Movimentacao[]
): Map<string, DetalhesMovimentacao> {
  const detalhes = new Map<string, DetalhesMovimentacao>();

  for (const movimentacao of movimentacoes) {
    detalhes.set(
      movimentacao.id,
      calcularDetalhesMovimentacao(meta, movimentacoes, movimentacao)
    );
  }

  return detalhes;
}
