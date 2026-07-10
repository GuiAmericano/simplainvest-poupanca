export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald-600">MetaPoupança</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Suas metas financeiras
        </h1>
        <p className="mt-3 text-zinc-600">
          Aplicação em desenvolvimento. Aqui você vai cadastrar metas, registrar
          aportes e acompanhar o progresso.
        </p>

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Fase atual</span>
            <span className="font-medium">1 — Setup</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-1/5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </main>
  );
}
