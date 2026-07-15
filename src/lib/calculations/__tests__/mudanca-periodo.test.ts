import { describe, expect, it } from "vitest";
import { calcularMudancaPeriodo } from "@/lib/calculations/mudanca-periodo";
import type { Meta, Movimentacao } from "@/types/database";

const metaBase: Meta = {
  id: "meta-1",
  nome: "Viagem",
  valor_objetivo: 20000,
  data_limite: "2026-12-31",
  taxa_rendimento_anual: 0.1,
  created_at: "2026-07-14T15:00:00.000Z",
};

describe("calcularMudancaPeriodo", () => {
  it("identifica período concluído com aportes corretos sem reajuste", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 3936.71,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T12:00:00.000Z",
      },
    ];

    const resumo = calcularMudancaPeriodo(metaBase, movimentacoes, 1, 2);

    expect(resumo).not.toBeNull();
    expect(resumo?.periodo_anterior).toBe(1);
    expect(resumo?.periodo_novo).toBe(2);
    expect(resumo?.reajustada).toBe(false);
    expect(resumo?.tipo_aporte).toBe("correto");
    expect(resumo?.aportado_periodo_anterior).toBe(3936.71);
  });

  it("identifica reajuste quando aporte ficou abaixo da parcela", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 3000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T12:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 3936.71,
        tipo: "aporte",
        descricao: null,
        data: "2026-08-14",
        created_at: "2026-08-14T12:00:00.000Z",
      },
    ];

    const resumo = calcularMudancaPeriodo(metaBase, movimentacoes, 1, 2);

    expect(resumo?.reajustada).toBe(true);
    expect(resumo?.tipo_aporte).toBe("abaixo");
    expect(resumo?.aportado_periodo_anterior).toBe(3000);
  });

  it("identifica aporte acima da parcela como parabenização", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 4000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T12:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 3936.71,
        tipo: "aporte",
        descricao: null,
        data: "2026-08-14",
        created_at: "2026-08-14T12:00:00.000Z",
      },
    ];

    const resumo = calcularMudancaPeriodo(metaBase, movimentacoes, 1, 2);

    expect(resumo?.reajustada).toBe(true);
    expect(resumo?.tipo_aporte).toBe("acima");
    expect(resumo?.aportado_periodo_anterior).toBe(4000);
  });
});
