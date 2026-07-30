import Link from "next/link";

interface Props {
  myScore: number;
  opponentScore: number;
}

export default function MatchResult({ myScore, opponentScore }: Props) {
  const tie = myScore === opponentScore;
  const won = myScore > opponentScore;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">Match Complete</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          {tie ? "It's a Tie!" : won ? "You Win! 🏆" : "You Lose"}
        </h1>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">You</p>
            <p className="text-4xl font-black text-amber-300">{myScore}</p>
          </div>
          <p className="text-2xl font-black text-slate-600">-</p>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Opponent</p>
            <p className="text-4xl font-black text-slate-200">{opponentScore}</p>
          </div>
        </div>

        <Link
          href="/battle"
          className="mt-8 block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98]"
        >
          Play Again
        </Link>
        <Link
          href="/"
          className="glass mt-3 block w-full rounded-2xl py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-white/10"
        >
          Back to Solo Mode
        </Link>
      </div>
    </div>
  );
}
