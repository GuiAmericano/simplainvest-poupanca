import { describe, expect, it } from "vitest";
import {
  formatDateLocal,
  formatDateLocalFromIso,
  obterDataReferencia,
  obterDataSaldoExibicao,
} from "@/lib/calculations/data-referencia";
import { calcularProgresso } from "@/lib/calculations/meta-progresso";
import type { Meta, Movimentacao } from "@/types/database";

const metaBase: Meta = {
  id: "meta-1",
  nome: "test1",
  valor_objetivo: 20000,
  data_limite: "2026-12-14",
  taxa_rendimento_anual: 0.1,
  created_at: "2026-07-14T15:00:00.000Z",
};

const movimentacoesDoisPeriodos: Movimentacao[] = [
  {
    id: "1",
    meta_id: "meta-1",
    valor: 3936.71,
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

describe("obterDataReferencia", () => {
  it("usa hoje local quando não há movimentações", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    expect(obterDataReferencia([], referencia)).toBe("2026-07-14");
  });

  it("usa a data da última movimentação quando ela é posterior a hoje", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    expect(
      obterDataReferencia(movimentacoesDoisPeriodos, referencia)
    ).toBe("2026-08-14");
  });

  it("usa a última movimentação quando hoje já passou dela", () => {
    const referencia = new Date(2026, 8, 1, 15, 0, 0);
    expect(
      obterDataReferencia(movimentacoesDoisPeriodos, referencia)
    ).toBe("2026-08-14");
  });
});

describe("obterDataSaldoExibicao", () => {
  it("usa hoje local quando não há movimentações", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    expect(obterDataSaldoExibicao([], referencia)).toBe("2026-07-14");
  });

  it("usa a data do último aporte quando ela é posterior a hoje", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    expect(
      obterDataSaldoExibicao(movimentacoesDoisPeriodos, referencia)
    ).toBe("2026-08-14");
  });

  it("usa hoje quando hoje é posterior ao último aporte", () => {
    const referencia = new Date(2026, 8, 1, 15, 0, 0);
    expect(
      obterDataSaldoExibicao(movimentacoesDoisPeriodos, referencia)
    ).toBe("2026-09-01");
  });

  it("usa a data do aporte quando é o dia seguinte a hoje", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const movimentacoes = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 1000,
        tipo: "aporte" as const,
        descricao: null,
        data: "2026-07-15",
        created_at: "2026-07-15T12:00:00.000Z",
      },
    ];

    expect(obterDataSaldoExibicao(movimentacoes, referencia)).toBe(
      "2026-07-15"
    );
  });

  it("usa a data da retirada quando ela é posterior a hoje e ao último aporte", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 1000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T12:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 200,
        tipo: "retirada",
        descricao: null,
        data: "2026-07-16",
        created_at: "2026-07-16T12:00:00.000Z",
      },
    ];

    expect(obterDataSaldoExibicao(movimentacoes, referencia)).toBe(
      "2026-07-16"
    );
  });

  it("considera retirada mesmo sem aportes", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 200,
        tipo: "retirada",
        descricao: null,
        data: "2026-07-15",
        created_at: "2026-07-15T12:00:00.000Z",
      },
    ];

    expect(obterDataSaldoExibicao(movimentacoes, referencia)).toBe(
      "2026-07-15"
    );
  });
});

describe("calcularProgresso com data de referência", () => {
  it("mantém período 2 no calendário quando os períodos 1 e 2 já foram pagos", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const progresso = calcularProgresso(
      metaBase,
      movimentacoesDoisPeriodos,
      referencia
    );

    expect(progresso.periodo_atual).toBe(2);
    expect(progresso.periodo_inicio).toBe("2026-08-14");
    expect(progresso.periodo_fim).toBe("2026-09-13");
    expect(progresso.total_aportado).toBe(7873.42);
    expect(progresso.falta_periodo_calendario).toBe(0);
    expect(progresso.falta_proximo_periodo).toBe(true);
    expect(progresso.falta_no_periodo).toBeGreaterThan(0);
  });

  it("mantém período 1 no calendário quando ele já foi pago integralmente", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const progresso = calcularProgresso(
      metaBase,
      [movimentacoesDoisPeriodos[0]],
      referencia
    );

    expect(progresso.periodo_atual).toBe(1);
    expect(progresso.falta_periodo_calendario).toBe(0);
    expect(progresso.falta_proximo_periodo).toBe(true);
    expect(progresso.falta_no_periodo).toBeGreaterThan(0);
  });

  it("mostra período 3 quando a data do saldo já está nele", () => {
    const referencia = new Date(2026, 8, 14, 15, 0, 0);
    const progresso = calcularProgresso(
      metaBase,
      movimentacoesDoisPeriodos,
      referencia
    );

    expect(progresso.periodo_atual).toBe(3);
    expect(progresso.periodo_inicio).toBe("2026-09-14");
  });

  it("mantém falta neste período quando a parcela atual ainda não foi paga", () => {
    const referencia = new Date(2026, 6, 14, 15, 0, 0);
    const progresso = calcularProgresso(metaBase, [], referencia);

    expect(progresso.periodo_atual).toBe(1);
    expect(progresso.falta_proximo_periodo).toBe(false);
    expect(progresso.falta_periodo_calendario).toBe(progresso.falta_no_periodo);
  });
});

describe("formatDateLocal", () => {
  it("formata usando fuso local, não UTC", () => {
    const date = new Date(2026, 6, 14, 23, 30, 0);
    expect(formatDateLocal(date)).toBe("2026-07-14");
  });
});

describe("formatDateLocalFromIso", () => {
  it("converte timestamp UTC para data local", () => {
    const iso = "2026-07-15T01:58:00.000Z";
    expect(formatDateLocalFromIso(iso)).toBe(
      formatDateLocal(new Date(iso))
    );
  });
});
