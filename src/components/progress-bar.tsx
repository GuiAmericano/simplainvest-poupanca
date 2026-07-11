type ProgressBarProps = {
  percentual: number;
  highlight?: boolean;
};

export function ProgressBar({ percentual, highlight = false }: ProgressBarProps) {
  const width = Math.min(Math.max(percentual, 0), 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <span>Progresso</span>
        <span className="font-medium text-zinc-700">{width.toFixed(0)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out ${
            highlight ? "shadow-[0_0_12px_rgba(16,185,129,0.6)]" : ""
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
