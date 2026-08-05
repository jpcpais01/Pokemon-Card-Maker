interface Props {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onRetry, onStartOver }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="card-raised pop-in flex w-full max-w-xs flex-col items-center gap-1 p-7 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/12 text-2xl">
          ⚠️
        </span>
        <p className="font-display text-xl font-extrabold text-white">Something went wrong</p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{message}</p>
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <button type="button" onClick={onRetry} className="btn-primary w-full">
            Try Again
          </button>
          <button type="button" onClick={onStartOver} className="btn-ghost w-full">
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
