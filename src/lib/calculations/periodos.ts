export type Periodo = {
  indice: number;
  inicio: string;
  fim: string;
};

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function gerarPeriodos(
  dataCriacao: string,
  dataLimite: string
): Periodo[] {
  const limite = parseDate(dataLimite);
  let inicio = parseDate(dataCriacao.slice(0, 10));
  const periodos: Periodo[] = [];

  while (inicio <= limite) {
    const fimNormal = addDays(addMonths(inicio, 1), -1);
    const fimSegundoMes = addDays(addMonths(inicio, 2), -1);

    if (fimSegundoMes > limite) {
      periodos.push({
        indice: periodos.length + 1,
        inicio: formatDate(inicio),
        fim: formatDate(limite),
      });
      break;
    }

    periodos.push({
      indice: periodos.length + 1,
      inicio: formatDate(inicio),
      fim: formatDate(fimNormal),
    });

    inicio = addDays(fimNormal, 1);
  }

  return periodos;
}

export function encontrarPeriodoAtual(
  periodos: Periodo[],
  referencia: Date | string = new Date()
): Periodo | null {
  if (periodos.length === 0) return null;

  const dataReferencia =
    typeof referencia === "string"
      ? referencia
      : formatDate(referencia);

  const ref = parseDate(dataReferencia);

  for (const periodo of periodos) {
    const inicio = parseDate(periodo.inicio);
    const fim = parseDate(periodo.fim);

    if (ref >= inicio && ref <= fim) {
      return periodo;
    }
  }

  const ultimo = periodos[periodos.length - 1];
  const fimUltimo = parseDate(ultimo.fim);

  if (ref > fimUltimo) {
    return ultimo;
  }

  return periodos[0];
}

export function contarPeriodosRestantes(
  periodos: Periodo[],
  periodoAtual: Periodo
): number {
  return periodos.length - periodoAtual.indice + 1;
}

export function isDataNoPeriodo(
  data: string,
  periodo: Periodo,
  ateData?: string
): boolean {
  const limiteSuperior = ateData ?? periodo.fim;
  return data >= periodo.inicio && data <= limiteSuperior;
}
