import type { Meta, MetaComProgresso } from "@/types/database";

export function calcularMesesRestantes(
  dataLimite: string,
  referencia = new Date()
): number {
  const limite = new Date(`${dataLimite}T12:00:00`);
  const hoje = new Date(referencia);
  hoje.setHours(12, 0, 0, 0);

  if (limite < hoje) return 0;

  const meses =
    (limite.getFullYear() - hoje.getFullYear()) * 12 +
    (limite.getMonth() - hoje.getMonth());

  return Math.max(meses, 1);
}

export function calcularProgresso(
  meta: Meta,
  totalAportado: number,
  referencia = new Date()
): MetaComProgresso {
  const total = Math.max(totalAportado, 0);
  const valorRestante = Math.max(meta.valor_objetivo - total, 0);
  const progressoPercentual =
    meta.valor_objetivo > 0
      ? Math.min((total / meta.valor_objetivo) * 100, 100)
      : 0;

  const mesesRestantes = calcularMesesRestantes(meta.data_limite, referencia);

  const valorMensalNecessario =
    valorRestante === 0
      ? 0
      : mesesRestantes > 0
        ? valorRestante / mesesRestantes
        : valorRestante;

  return {
    ...meta,
    total_aportado: total,
    valor_restante: valorRestante,
    progresso_percentual: Math.round(progressoPercentual * 100) / 100,
    meses_restantes: mesesRestantes,
    valor_mensal_necessario: Math.round(valorMensalNecessario * 100) / 100,
  };
}
