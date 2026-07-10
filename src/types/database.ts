export type Meta = {
  id: string;
  nome: string;
  valor_objetivo: number;
  data_limite: string;
  created_at: string;
};

export type Movimentacao = {
  id: string;
  meta_id: string;
  valor: number;
  descricao: string | null;
  data: string;
  created_at: string;
};

export type MetaComProgresso = Meta & {
  total_aportado: number;
  valor_restante: number;
  progresso_percentual: number;
  meses_restantes: number;
  valor_mensal_necessario: number;
};
