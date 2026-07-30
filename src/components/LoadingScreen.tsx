export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="glass flex max-w-xs flex-col items-center gap-5 rounded-[2rem] px-8 py-10 text-center shadow-2xl shadow-black/40">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400" />
        <p className="text-sm font-medium text-slate-200">{message}</p>
      </div>
    </div>
  );
}
