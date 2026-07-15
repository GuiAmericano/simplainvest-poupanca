import { describe, expect, it } from "vitest";
import { calcularProgresso } from "@/lib/calculations/meta-progresso";
import {
  calcularSerieEvolucao,
  calcularSerieProjecaoIdeal,
  calcularSerieSaldoReal,
  montarDadosGraficoEvolucao,
} from "@/lib/calculations/serie-evolucao";
import {
  calcularPMT,
  arredondarMoeda,
  dataCriacaoMeta,
  gerarPeriodosMeta,
  taxaMensalEfetiva,
} from "@/lib/calculations/juros-compostos";
import type { Meta, Movimentacao } from "@/types/database";

const metaBase: Meta = {
  id: "meta-1",
  nome: "Viagem",
  valor_objetivo: 20000,
  data_limite: "2026-12-31",
  taxa_rendimento_anual: 0.1,
  created_at: "2026-07-14T15:00:00.000Z",
};

const referencia = new Date("2026-07-14T12:00:00");

describe("calcularSerieSaldoReal", () => {
  it("começa em dataCriacaoMeta com saldo 0", () => {
    const metaComProgresso = calcularProgresso(metaBase, [], referencia);
    const pontos = calcularSerieSaldoReal(metaComProgresso, [], referencia);

    expect(pontos[0]).toMatchObject({
      data: dataCriacaoMeta(metaBase),
      saldo: 0,
      tipo: "inicio",
    });
  });

  it("gera um ponto real por movimentação com saldo após a operação", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 3000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-20",
        created_at: "2026-07-20T12:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 1000,
        tipo: "retirada",
        descricao: null,
        data: "2026-08-10",
        created_at: "2026-08-10T12:00:00.000Z",
      },
    ];

    const referenciaAvancada = new Date("2026-08-10T12:00:00");
    const metaComProgresso = calcularProgresso(
      metaBase,
      movimentacoes,
      referenciaAvancada
    );
    const pontos = calcularSerieSaldoReal(
      metaComProgresso,
      movimentacoes,
      referenciaAvancada
    );

    const pontosMovimentacao = pontos.filter((p) => p.tipo === "movimentacao");
    expect(pontosMovimentacao).toHaveLength(2);

    const aporte = pontosMovimentacao[0];
    const retirada = pontosMovimentacao[1];

    expect(aporte.data).toBe("2026-07-20");
    expect(aporte.movimentacao?.tipo).toBe("aporte");
    expect(aporte.saldo).toBeGreaterThan(0);

    expect(retirada.data).toBe("2026-08-10");
    expect(retirada.movimentacao?.tipo).toBe("retirada");
    expect(retirada.saldo).toBeLessThan(aporte.saldo);
  });

  it("posiciona movimentações pela data informada, não pelo created_at", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 5000,
        tipo: "aporte",
        descricao: null,
        data: "2026-10-15",
        created_at: "2026-07-14T15:00:00.000Z",
      },
    ];

    const referenciaOutubro = new Date("2026-10-20T12:00:00");
    const metaComProgresso = calcularProgresso(
      metaBase,
      movimentacoes,
      referenciaOutubro
    );
    const pontos = calcularSerieSaldoReal(
      metaComProgresso,
      movimentacoes,
      referenciaOutubro
    );

    const aporte = pontos.find((p) => p.tipo === "movimentacao");
    expect(aporte?.data).toBe("2026-10-15");
    expect(aporte?.timestamp).toBe(
      new Date("2026-10-15T12:00:00").getTime()
    );
  });

  it("inclui ponto de hoje quando a meta está ativa e sem movimentação hoje", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 3000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T15:00:00.000Z",
      },
    ];

    const referenciaFutura = new Date("2026-09-20T12:00:00");
    const metaComProgresso = calcularProgresso(
      metaBase,
      movimentacoes,
      referenciaFutura
    );
    const pontos = calcularSerieSaldoReal(
      metaComProgresso,
      movimentacoes,
      referenciaFutura
    );

    const pontoAtual = pontos.find((p) => p.tipo === "atual");
    expect(pontoAtual).toBeDefined();
    expect(pontoAtual?.data).toBe("2026-09-20");
    expect(pontoAtual?.saldo).toBeGreaterThan(3000);
  });

  it("meta concluída não adiciona ponto atual extra", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 20000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-14",
        created_at: "2026-07-14T15:00:00.000Z",
      },
    ];

    const referenciaFinal = new Date("2026-12-31T12:00:00");
    const metaComProgresso = calcularProgresso(
      metaBase,
      movimentacoes,
      referenciaFinal
    );
    const pontos = calcularSerieSaldoReal(
      metaComProgresso,
      movimentacoes,
      referenciaFinal
    );

    expect(metaComProgresso.progresso_percentual).toBeGreaterThanOrEqual(100);
    expect(pontos.some((p) => p.tipo === "atual")).toBe(false);
    expect(pontos.at(-1)?.saldo).toBeGreaterThanOrEqual(20000);
  });

  it("preserva ordem cronológica com múltiplas movimentações no mesmo dia", () => {
    const movimentacoes: Movimentacao[] = [
      {
        id: "1",
        meta_id: "meta-1",
        valor: 1000,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-20",
        created_at: "2026-07-20T10:00:00.000Z",
      },
      {
        id: "2",
        meta_id: "meta-1",
        valor: 500,
        tipo: "aporte",
        descricao: null,
        data: "2026-07-20",
        created_at: "2026-07-20T15:00:00.000Z",
      },
    ];

    const metaComProgresso = calcularProgresso(metaBase, movimentacoes, referencia);
    const pontos = calcularSerieSaldoReal(
      metaComProgresso,
      movimentacoes,
      referencia
    );

    const pontosMovimentacao = pontos.filter((p) => p.tipo === "movimentacao");
    expect(pontosMovimentacao).toHaveLength(2);
    expect(pontosMovimentacao[0].saldo).toBe(1000);
    expect(pontosMovimentacao[1].saldo).toBe(1500);
    expect(pontosMovimentacao[0].timestamp).toBeLessThan(
      pontosMovimentacao[1].timestamp
    );
  });
});

describe("calcularSerieProjecaoIdeal", () => {
  it("começa em zero na data de criação", () => {
    const pontos = calcularSerieProjecaoIdeal(metaBase);

    expect(pontos[0]).toMatchObject({
      data: dataCriacaoMeta(metaBase),
      saldo_ideal: 0,
      tipo: "inicio",
    });
  });

  it("atinge o valor objetivo no último período", () => {
    const pontos = calcularSerieProjecaoIdeal(metaBase);
    const ultimo = pontos.at(-1);

    expect(ultimo?.data).toBe(metaBase.data_limite);
    expect(ultimo?.saldo_ideal).toBeGreaterThanOrEqual(metaBase.valor_objetivo - 0.02);
    expect(ultimo?.saldo_ideal).toBeLessThanOrEqual(metaBase.valor_objetivo + 0.02);
  });

  it("usa PMT constante em todos os períodos", () => {
    const periodos = gerarPeriodosMeta(metaBase);
    const taxaMensal = taxaMensalEfetiva(metaBase.taxa_rendimento_anual);
    const parcelaEsperada = arredondarMoeda(
      calcularPMT(metaBase.valor_objetivo, periodos.length, taxaMensal)
    );

    const pontos = calcularSerieProjecaoIdeal(metaBase);
    let saldo = 0;

    for (const periodo of periodos) {
      if (taxaMensal > 0) {
        saldo *= 1 + taxaMensal;
      }
      saldo += parcelaEsperada;

      const ponto = pontos.find((p) => p.data === periodo.fim);
      expect(ponto?.saldo_ideal).toBe(arredondarMoeda(saldo));
    }
  });
});

describe("montarDadosGraficoEvolucao", () => {
  it("cobre o eixo temporal do início ao fim da meta", () => {
    const metaComProgresso = calcularProgresso(metaBase, [], referencia);
    const dados = montarDadosGraficoEvolucao(metaComProgresso, [], referencia);

    expect(dados.data_inicio).toBe(dataCriacaoMeta(metaBase));
    expect(dados.data_fim).toBe("2026-12-31");
    expect(dados.timestamp_inicio).toBeLessThan(dados.timestamp_fim);
  });

  it("mescla saldo real e projeção ideal nos pontos corretos", () => {
    const metaComProgresso = calcularProgresso(metaBase, [], referencia);
    const dados = montarDadosGraficoEvolucao(metaComProgresso, [], referencia);

    const inicio = dados.pontos.find((p) => p.tipo === "inicio");
    expect(inicio?.saldo).toBe(0);
    expect(inicio?.saldo_ideal).toBe(0);

    const pontosIdeal = dados.pontos.filter((p) => p.saldo_ideal != null);
    expect(pontosIdeal.length).toBeGreaterThan(1);

    const pontosComAmbos = dados.pontos.filter(
      (p) => p.saldo != null && p.saldo_ideal != null
    );
    expect(pontosComAmbos.some((p) => p.tipo === "inicio")).toBe(true);
  });

  it("inclui saldo_ideal em datas futuras sem saldo real", () => {
    const metaComProgresso = calcularProgresso(metaBase, [], referencia);
    const dados = montarDadosGraficoEvolucao(metaComProgresso, [], referencia);

    const pontosFuturos = dados.pontos.filter(
      (p) => p.saldo == null && p.saldo_ideal != null && p.tipo === "ideal"
    );
    expect(pontosFuturos.length).toBeGreaterThan(0);
  });
});

describe("calcularSerieEvolucao (legado)", () => {
  it("mantém compatibilidade com pontos de saldo real", () => {
    const metaComProgresso = calcularProgresso(metaBase, [], referencia);
    const serie = calcularSerieEvolucao(metaComProgresso, [], referencia);

    expect(serie.pontos.length).toBeGreaterThan(0);
    expect(serie.pontos.every((p) => typeof p.saldo === "number")).toBe(true);
    expect(serie.pontos[0].objetivo).toBe(metaBase.valor_objetivo);
  });
});
