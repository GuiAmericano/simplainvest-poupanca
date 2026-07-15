"use client";

import {
  montarDadosGraficoEvolucao,
  type PontoGraficoEvolucao,
} from "@/lib/calculations/serie-evolucao";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MetaComProgresso, Movimentacao } from "@/types/database";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetaEvolucaoGraficoProps = {
  meta: MetaComProgresso;
};

type CustomDotProps = {
  cx?: number;
  cy?: number;
  payload?: PontoGraficoEvolucao;
};

function formatAxisDate(data: string): string {
  const [, month, day] = data.split("-");
  return `${day}/${month}`;
}

function formatAxisCurrency(value: number): string {
  if (value === 0) return "R$ 0";
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${Math.round(value / 1_000)}k`;
  }
  return formatCurrency(value);
}

function gerarTicksEixoX(pontos: PontoGraficoEvolucao[]): {
  timestamps: number[];
  datasPorTimestamp: Map<number, string>;
} {
  const datasPorTimestamp = new Map<number, string>();

  for (const ponto of pontos) {
    if (ponto.tipo === "inicio" || ponto.tipo === "ideal") {
      datasPorTimestamp.set(ponto.timestamp, ponto.data);
    }
  }

  const timestamps = Array.from(datasPorTimestamp.keys()).sort((a, b) => a - b);

  return { timestamps, datasPorTimestamp };
}

function gerarTicksEixoY(valorObjetivo: number): number[] {
  if (valorObjetivo <= 0) return [0];

  const fatores = [0, 0.25, 0.5, 0.75, 1];
  return fatores.map((fator) => Math.round(valorObjetivo * fator));
}

function labelTipoPonto(ponto: PontoGraficoEvolucao): string {
  if (ponto.tipo === "inicio") return "Início da meta";
  if (ponto.tipo === "atual") return "Saldo atual";
  if (ponto.tipo === "periodo") return "Fim do período";
  if (ponto.movimentacao?.tipo === "retirada") return "Retirada";
  if (ponto.movimentacao?.tipo === "aporte") return "Aporte";
  if (ponto.tipo === "ideal") return "Projeção ideal";
  return "Movimentação";
}

function SaldoDot({ cx, cy, payload }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;

  if (payload.tipo === "movimentacao" && payload.movimentacao) {
    const isRetirada = payload.movimentacao.tipo === "retirada";
    const fill = isRetirada ? "#ef4444" : "#22c55e";
    const size = 5;

    if (isRetirada) {
      return (
        <g style={{ pointerEvents: "all" }}>
          <circle cx={cx} cy={cy} r={10} fill="transparent" />
          <polygon
            points={`${cx},${cy + size} ${cx - size},${cy - size} ${cx + size},${cy - size}`}
            fill={fill}
            stroke={fill}
            strokeWidth={1}
          />
        </g>
      );
    }

    return (
      <g style={{ pointerEvents: "all" }}>
        <circle cx={cx} cy={cy} r={10} fill="transparent" />
        <polygon
          points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
          fill={fill}
          stroke={fill}
          strokeWidth={1}
        />
      </g>
    );
  }

  return null;
}

function EvolucaoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: PontoGraficoEvolucao; dataKey?: string }[];
}) {
  if (!active || !payload?.length) return null;

  const ponto = payload[0]?.payload;
  if (!ponto || ponto.tipo !== "movimentacao" || !ponto.movimentacao) return null;

  return (
    <div className="border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-foreground">{formatDate(ponto.data)}</p>
      <p className="mb-2 text-muted-foreground">{labelTipoPonto(ponto)}</p>

      <p
        className={`mb-2 font-medium ${
          ponto.movimentacao.tipo === "retirada"
            ? "text-red-600 dark:text-red-400"
            : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {ponto.movimentacao.tipo === "retirada" ? "Retirada" : "Aporte"} de{" "}
        {formatCurrency(ponto.movimentacao.valor)}
      </p>

      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Saldo</span>
        <span className="font-medium tabular-nums text-blue-600 dark:text-blue-400">
          {formatCurrency(ponto.saldo ?? 0)}
        </span>
      </div>
    </div>
  );
}

export function MetaEvolucaoGrafico({ meta }: MetaEvolucaoGraficoProps) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dados = useMemo(
    () => montarDadosGraficoEvolucao(meta, movimentacoes),
    [meta, movimentacoes]
  );

  const { timestamps: ticksEixoX, datasPorTimestamp } = useMemo(
    () => gerarTicksEixoX(dados.pontos),
    [dados.pontos]
  );

  const ticksEixoY = useMemo(
    () => gerarTicksEixoY(meta.valor_objetivo),
    [meta.valor_objetivo]
  );

  const temMovimentacoes = dados.pontos.some((p) => p.tipo === "movimentacao");

  useEffect(() => {
    let active = true;

    async function loadMovimentacoes() {
      try {
        const response = await fetch(`/api/metas/${meta.id}/movimentacoes`);
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          setError(data.error ?? "Erro ao carregar dados do gráfico.");
          return;
        }

        setMovimentacoes(data);
      } catch {
        if (!active) return;
        setError("Não foi possível carregar os dados do gráfico.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    setIsLoading(true);
    setError(null);
    loadMovimentacoes();

    return () => {
      active = false;
    };
  }, [meta.id]);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (dados.pontos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem dados suficientes para exibir o gráfico.
      </p>
    );
  }

  return (
    <div
      aria-label={`Gráfico de evolução da meta ${meta.nome}`}
      className="border border-border bg-surface p-4"
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {formatDate(dados.data_inicio)} — {formatDate(dados.data_fim)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-blue-500" />
          Saldo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-emerald-500" />
          Projeção ideal
        </span>
        {temMovimentacoes && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-emerald-500" />
              Aporte
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-red-500" />
              Retirada
            </span>
          </>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados.pontos}
            margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#e4e4e7"
              strokeDasharray="3 3"
              className="dark:opacity-30"
            />
            <XAxis
              type="number"
              dataKey="timestamp"
              domain={[dados.timestamp_inicio, dados.timestamp_fim]}
              ticks={ticksEixoX}
              tickFormatter={(timestamp) => {
                const data = datasPorTimestamp.get(timestamp);
                return data ? formatAxisDate(data) : "";
              }}
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={{ stroke: "#e4e4e7" }}
            />
            <YAxis
              ticks={ticksEixoY}
              domain={[0, meta.valor_objetivo]}
              tickFormatter={formatAxisCurrency}
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={{ stroke: "#e4e4e7" }}
              width={64}
            />
            <Tooltip
              content={<EvolucaoTooltip />}
              cursor={false}
              shared={false}
              isAnimationActive={false}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  saldo: "Saldo",
                  saldo_ideal: "Projeção ideal",
                };
                return labels[value] ?? value;
              }}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="saldo_ideal"
              name="saldo_ideal"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              connectNulls
              style={{ pointerEvents: "none" }}
            />
            <Line
              type="stepAfter"
              dataKey="saldo"
              name="saldo"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<SaldoDot />}
              activeDot={false}
              connectNulls
              style={{ pointerEvents: "none" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
