"use client";

import { MetaCard } from "@/components/meta-card";
import type { MetaComProgresso } from "@/types/database";
import { useState } from "react";

type MetasSectionProps = {
  title: string;
  metas: MetaComProgresso[];
  emptyMessage: string;
  defaultExpanded?: boolean;
};

export function MetasSection({
  title,
  metas,
  emptyMessage,
  defaultExpanded = false,
}: MetasSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between border border-border bg-surface px-5 py-4 text-left text-foreground transition hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide">
            {title}
          </span>
          <span className="border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
            {metas.length} {metas.length === 1 ? "meta" : "metas"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border border-t-0 border-border bg-muted">
          {metas.length === 0 ? (
            <div className="border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {metas.map((meta) => (
                <MetaCard key={meta.id} meta={meta} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
