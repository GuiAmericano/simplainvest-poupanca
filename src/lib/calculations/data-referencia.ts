import type { Movimentacao } from "@/types/database";

export function formatDateLocal(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Converte timestamp ISO (UTC) para data local YYYY-MM-DD. */
export function formatDateLocalFromIso(iso: string): string {
  return formatDateLocal(new Date(iso));
}

export function obterDataUltimaMovimentacao(
  movimentacoes: Movimentacao[]
): string | null {
  if (movimentacoes.length === 0) return null;

  return movimentacoes.reduce((latest, movimentacao) => {
    return movimentacao.data > latest ? movimentacao.data : latest;
  }, movimentacoes[0].data);
}

export function obterDataUltimoAporte(
  movimentacoes: Movimentacao[]
): string | null {
  const aportes = movimentacoes.filter(
    (movimentacao) => movimentacao.tipo === "aporte"
  );

  if (aportes.length === 0) return null;

  return aportes.reduce((latest, movimentacao) => {
    return movimentacao.data > latest ? movimentacao.data : latest;
  }, aportes[0].data);
}

/** Mais recente entre hoje (fuso local) e a data da última movimentação (aporte ou retirada). */
export function obterDataSaldoExibicao(
  movimentacoes: Movimentacao[],
  referencia = new Date()
): string {
  const hojeLocal = formatDateLocal(referencia);
  const dataUltimaMovimentacao = obterDataUltimaMovimentacao(movimentacoes);

  if (!dataUltimaMovimentacao) {
    return hojeLocal;
  }

  return dataUltimaMovimentacao > hojeLocal
    ? dataUltimaMovimentacao
    : hojeLocal;
}

/**
 * Data de referência para período, saldo e parcela.
 * - Sem movimentações: hoje (fuso local).
 * - Com movimentações: menor entre hoje local e a data da última movimentação;
 *   se a última movimentação for posterior a hoje, usa essa data para refletir
 *   o período em que o usuário já aportou.
 */
export function obterDataReferencia(
  movimentacoes: Movimentacao[],
  referencia = new Date()
): string {
  const hojeLocal = formatDateLocal(referencia);
  const dataUltimaMovimentacao = obterDataUltimaMovimentacao(movimentacoes);

  if (!dataUltimaMovimentacao) {
    return hojeLocal;
  }

  return dataUltimaMovimentacao;
}