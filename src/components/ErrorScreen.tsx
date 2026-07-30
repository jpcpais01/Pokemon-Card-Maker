interface Props {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onRetry, onStartOver }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="max-w-xs text-sm text-slate-300">{message}</p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-slate-900 active:scale-[0.98]"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="w-full rounded-xl border border-slate-700 py-3.5 text-sm font-semibold text-slate-200 active:bg-slate-800"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
