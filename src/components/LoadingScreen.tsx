export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5">
      <div className="glass-strong rise-in flex w-full max-w-xs flex-col items-center gap-5 rounded-[2rem] px-8 py-10 text-center shadow-2xl shadow-black/40">
        <span className="brand-gradient flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl text-2xl shadow-lg shadow-fuchsia-500/20">
          ✨
        </span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="progress-fill h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
        </div>
        <p className="text-sm font-medium text-slate-200">{message}</p>
      </div>
    </div>
  );
}
