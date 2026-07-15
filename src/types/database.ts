export type Meta = {
  id: string;
  nome: string;
  valor_objetivo: number;
  data_limite: string;
  taxa_rendimento_anual: number;
  created_at: string;
};

export type TipoMovimentacao = "aporte" | "retirada";

export type Movimentacao = {
  id: string;
  meta_id: string;
  valor: number;
  tipo: TipoMovimentacao;
  descricao: string | null;
  data: string;
  created_at: string;
};

export type MetaComProgresso = Meta & {
  data_saldo: string;
  total_aportado: number;
  total_retirado: number;
  saldo_atual: number;
  rendimento_acumulado: number;
  valor_restante: number;
  progresso_percentual: number;
  total_periodos: number;
  periodo_atual: number;
  periodo_inicio: string;
  periodo_fim: string;
  valor_parcela_periodo: number;
  aportado_no_periodo: number;
  falta_no_periodo: number;
  falta_periodo_calendario: number;
  falta_proximo_periodo: boolean;
};
