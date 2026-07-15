type ProgressBarProps = {
  percentual: number;
  highlight?: boolean;
};

export function ProgressBar({ percentual, highlight = false }: ProgressBarProps) {
  const width = Math.min(Math.max(percentual, 0), 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Progresso</span>
        <span className="font-medium text-foreground">{width.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden border border-border bg-muted">
        <div
          className={`h-full bg-emerald-500 transition-all duration-700 ease-out dark:bg-emerald-400 ${
            highlight ? "shadow-[0_0_12px_rgba(16,185,129,0.6)]" : ""
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
