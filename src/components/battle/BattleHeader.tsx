import { BATTLE_ROUNDS } from "@/lib/battle/types";

interface Props {
  round: number;
  myScore: number;
  opponentScore: number;
}

export default function BattleHeader({ round, myScore, opponentScore }: Props) {
  return (
    <div className="glass mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">You</p>
        <p className="text-xl font-black text-amber-300">{myScore}</p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
        Round {round} / {BATTLE_ROUNDS}
      </p>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opponent</p>
        <p className="text-xl font-black text-slate-200">{opponentScore}</p>
      </div>
    </div>
  );
}
