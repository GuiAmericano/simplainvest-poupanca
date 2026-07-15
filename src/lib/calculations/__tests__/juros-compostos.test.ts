import { describe, expect, it } from "vitest";
import { calcularProgresso } from "@/lib/calculations/meta-progresso";
import {
  calcularPMT,
  calcularParcelaPeriodo,
  calcularSaldoComRendimento,
  dataCriacaoMeta,
  gerarPeriodosMeta,
  taxaMensalEfetiva,
} from "@/lib/calculations/juros-compostos";
import { formatDateLocalFromIso } from "@/lib/calculations/data-referencia";
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

describe("dataCriacaoMeta", () => {
  it("usa data local do created_at, não a parte UTC da string", () => {
    const meta: Meta = {
      ...metaBase,
      created_at: "2026-07-15T01:58:00.000Z",
    };

    expect(dataCriacaoMeta(meta)).toBe(
      formatDateLocalFromIso(meta.created_at)
    );
    expect(dataCriacaoMeta(meta)).not.toBe(meta.created_at.slice(0, 10));
  });
});

describe("calcularPMT", () => {
  it("calcula parcela com juros compostos próxima de R$ 3.936,71", () => {
    const taxaMensal = taxaMensalEfetiva(0.1);
    const pmt = calcularPMT(20000, 5, taxaMensal);

    expect(pmt).toBeGreaterThan(3920);
    expect(pmt).toBeLessThan(3950);
  });

  it("usa divisão linear quando a taxa é zero", () => {
    expect(calcularPMT(20000, 5, 0)).toBe(4000);
  });
});

describe("calcularSaldoComRendimento", () => {
  it("acumula rendimento sobre aportes", () => {
    const periodos = gerarPeriodos("2026-07-14", "2026-12-31");
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
    ];

    const saldo = calcularSaldoComRendimento(
      movimentacoes,
      0.1,
      periodos,
      "2026-09-13"
    );

    expect(saldo).toBeGreaterThan(4000);
  });
});

describe("calcularParcelaPeriodo", () => {
  it("recalcula parcela após aporte abaixo do esperado no período 1", () => {
    const periodos = gerarPeriodosMeta(metaBase);
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 2000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-20",
        created_at: "2026-07-20T12:00:00.000Z",
      },
    ];

    const parcelaInicial = calcularParcelaPeriodo(
      metaBase,
      [],
      periodos,
      periodos[0]
    );
    const parcelaPeriodo2 = calcularParcelaPeriodo(
      metaBase,
      movimentacoes,
      periodos,
      periodos[1]
    );

    expect(parcelaPeriodo2).toBeGreaterThan(parcelaInicial);
  });

  it("aumenta parcela após retirada parcial", () => {
    const periodos = gerarPeriodosMeta(metaBase);
    const movimentacoesComRetirada: Movimentacao[] = [
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

    const parcelaSemRetirada = calcularParcelaPeriodo(
      metaBase,
      [
        {
          id: "1",
          meta_id: "meta-1",
          valor: 4000,
          tipo: "aporte",
          descricao: null,
          data: "2026-07-20",
          created_at: "2026-07-20T12:00:00.000Z",
        },
      ],
      periodos,
      periodos[1]
    );

    const parcelaComRetirada = calcularParcelaPeriodo(
      metaBase,
      movimentacoesComRetirada,
      periodos,
      periodos[1]
    );

    expect(parcelaComRetirada).toBeGreaterThan(parcelaSemRetirada);
  });
});

describe("calcularProgresso", () => {
  it("marca meta concluída quando saldo atinge o objetivo", () => {
    const periodos = gerarPeriodosMeta(metaBase);
    const parcela = calcularPMT(20000, periodos.length, taxaMensalEfetiva(0.1));

    const movimentacoes: Movimentacao[] = periodos.map((periodo, index) => ({
      id: String(index + 1),
      meta_id: "meta-1",
      valor: parcela,
      tipo: "aporte" as const,
      descricao: null,
      data: periodo.inicio,
      created_at: `${periodo.inicio}T12:00:00.000Z`,
    }));

    const progresso = calcularProgresso(
      metaBase,
      movimentacoes,
      new Date("2026-12-31T12:00:00")
    );

    expect(progresso.saldo_atual).toBeGreaterThanOrEqual(19999);
    expect(progresso.progresso_percentual).toBeGreaterThanOrEqual(99.99);
    expect(progresso.valor_parcela_periodo).toBe(0);
  });
});
