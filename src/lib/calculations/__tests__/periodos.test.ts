import { describe, expect, it } from "vitest";
import { gerarPeriodos } from "@/lib/calculations/periodos";

describe("gerarPeriodos", () => {
  it("gera 5 períodos com último estendido até a data limite", () => {
    const periodos = gerarPeriodos("2026-07-14", "2026-12-31");

    expect(periodos).toHaveLength(5);
    expect(periodos[0]).toEqual({
      indice: 1,
      inicio: "2026-07-14",
      fim: "2026-08-13",
    });
    expect(periodos[1]).toEqual({
      indice: 2,
      inicio: "2026-08-14",
      fim: "2026-09-13",
    });
    expect(periodos[2]).toEqual({
      indice: 3,
      inicio: "2026-09-14",
      fim: "2026-10-13",
    });
    expect(periodos[3]).toEqual({
      indice: 4,
      inicio: "2026-10-14",
      fim: "2026-11-13",
    });
    expect(periodos[4]).toEqual({
      indice: 5,
      inicio: "2026-11-14",
      fim: "2026-12-31",
    });
  });

  it("gera um único período quando o prazo é menor que dois meses", () => {
    const periodos = gerarPeriodos("2026-07-14", "2026-08-20");

    expect(periodos).toHaveLength(1);
    expect(periodos[0]).toEqual({
      indice: 1,
      inicio: "2026-07-14",
      fim: "2026-08-20",
    });
  });
});
