export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400" />
      <p className="max-w-xs text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
}
