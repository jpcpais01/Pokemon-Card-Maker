interface Props {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onRetry, onStartOver }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="glass flex w-full max-w-xs flex-col items-center gap-5 rounded-[2rem] px-6 py-9 text-center shadow-2xl shadow-black/40">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="glass w-full rounded-2xl py-3.5 text-sm font-semibold text-slate-200 active:bg-white/10"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
