interface Props {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onRetry, onStartOver }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="glass-strong rise-in flex w-full max-w-xs flex-col items-center gap-5 rounded-[2rem] px-6 py-9 text-center shadow-2xl shadow-black/40">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex w-full flex-col gap-3">
          <button type="button" onClick={onRetry} className="btn-primary w-full active:scale-[0.98]">
            Try Again
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="btn-ghost w-full active:bg-white/10 active:scale-[0.98]"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
