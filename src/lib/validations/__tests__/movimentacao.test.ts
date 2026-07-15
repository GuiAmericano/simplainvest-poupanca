import { describe, expect, it } from "vitest";
import {
  validateDataDentroIntervaloMeta,
  validateValorContraSaldo,
} from "@/lib/validations/movimentacao";
import type { Meta } from "@/types/database";

const meta: Meta = {
  id: "meta-1",
  nome: "Viagem",
  valor_objetivo: 20000,
  data_limite: "2026-12-14",
  taxa_rendimento_anual: 0.1,
  created_at: "2026-07-14T15:00:00.000Z",
};

describe("validateDataDentroIntervaloMeta", () => {
  it("aceita data no intervalo da meta", () => {
    expect(validateDataDentroIntervaloMeta(meta, "2026-08-01").success).toBe(
      true
    );
  });

  it("aceita data de início e fim", () => {
    expect(validateDataDentroIntervaloMeta(meta, "2026-07-14").success).toBe(
      true
    );
    expect(validateDataDentroIntervaloMeta(meta, "2026-12-14").success).toBe(
      true
    );
  });

  it("rejeita data anterior à criação da meta", () => {
    const result = validateDataDentroIntervaloMeta(meta, "2026-07-13");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("anterior");
    }
  });

  it("rejeita data posterior à data limite", () => {
    const result = validateDataDentroIntervaloMeta(meta, "2026-12-15");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("posterior");
    }
  });
});

describe("validateValorContraSaldo", () => {
  it("aceita retirada igual ao saldo", () => {
    expect(validateValorContraSaldo(10000, 10000).success).toBe(true);
  });

  it("aceita retirada menor que o saldo", () => {
    expect(validateValorContraSaldo(10000, 5000).success).toBe(true);
  });

  it("rejeita retirada maior que o saldo", () => {
    const result = validateValorContraSaldo(10000, 10000.02);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Saldo insuficiente");
    }
  });

  it("rejeita retirada quando saldo é zero", () => {
    const result = validateValorContraSaldo(0, 100);
    expect(result.success).toBe(false);
  });
});
