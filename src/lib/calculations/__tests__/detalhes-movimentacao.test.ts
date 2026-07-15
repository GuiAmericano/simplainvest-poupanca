import { describe, expect, it } from "vitest";
import { calcularDetalhesMovimentacao } from "@/lib/calculations/detalhes-movimentacao";
import { calcularPMT, taxaMensalEfetiva } from "@/lib/calculations/juros-compostos";
import { gerarPeriodos } from "@/lib/calculations/periodos";
import type { Meta, Movimentacao } from "@/types/database";

const metaBase: Meta = {
  id: "meta-1",
  nome: "Viagem",
  valor_objetivo: 20000,
  data_limite: "2026-12-31",
  taxa_rendimento_anual: 0.1,
  created_at: "2026-07-14T15:00:00.000Z",
};

describe("calcularDetalhesMovimentacao", () => {
  it("calcula detalhes do primeiro aporte sem juros (caso da print)", () => {
    const periodos = gerarPeriodos("2026-07-14", "2026-12-31");
    const parcela = calcularPMT(20000, periodos.length, taxaMensalEfetiva(0.1));
    const valorAporte = Math.round(parcela * 100) / 100;

    const movimentacao: Movimentacao = {
      id: "1",
      meta_id: "meta-1",
      valor: valorAporte,
      tipo: "aporte",
      descricao: null,
      data: "2026-07-14",
      created_at: "2026-07-14T15:00:00.000Z",
    };

    const detalhes = calcularDetalhesMovimentacao(metaBase, [movimentacao], movimentacao);

    expect(detalhes.aportes_liquidos).toBe(valorAporte);
    expect(detalhes.juros_periodo).toBe(0);
    expect(detalhes.juros_acumulados).toBe(0);
    expect(detalhes.saldo_apos_movimentacao).toBe(valorAporte);
    expect(detalhes.periodo_indice).toBe(1);
    expect(detalhes.descricao_contextual).toContain("sem juros neste mês");
  });

  it("calcula juros do período após início do segundo mês", () => {
    const periodos = gerarPeriodos("2026-07-14", "2026-12-31");
    const parcela = calcularPMT(20000, periodos.length, taxaMensalEfetiva(0.1));
    const valorAporte = Math.round(parcela * 100) / 100;

    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: valorAporte,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T15:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: valorAporte,
        tipo: "aporte",
        descricao: null,
        data: periodos[1].inicio,
        created_at: `${periodos[1].inicio}T12:00:00.000Z`,
      },
    ];

    const detalhes = calcularDetalhesMovimentacao(
      metaBase,
      movimentacoes,
      movimentacoes[1]
    );

    expect(detalhes.juros_periodo).toBeGreaterThan(0);
    expect(detalhes.periodo_indice).toBe(2);
    expect(detalhes.descricao_contextual).toContain("juros de");
  });

  it("calcula detalhes de retirada com saldo reduzido", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 4000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-20",
        created_at: "2026-07-20T12:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 500,
        tipo: "retirada",
        descricao: null,
        data: "2026-08-01",
        created_at: "2026-08-01T12:00:00.000Z",
      },
    ];

    const detalhes = calcularDetalhesMovimentacao(
      metaBase,
      movimentacoes,
      movimentacoes[1]
    );

    expect(detalhes.aportes_liquidos).toBe(3500);
    expect(detalhes.saldo_apos_movimentacao).toBeLessThan(4000);
    expect(detalhes.descricao_contextual).toContain("retirada");
  });
});
