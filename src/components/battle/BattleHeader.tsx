import { BATTLE_ROUNDS } from "@/lib/battle/types";

export interface BattleHeaderPlayer {
  id: string;
  label: string;
  score: number;
}

interface Props {
  round: number;
  myScore: number;
  others: BattleHeaderPlayer[];
}

export default function BattleHeader({ round, myScore, others }: Props) {
  return (
    <div className="glass mb-6 rounded-2xl px-4 py-3">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
        Round {round} / {BATTLE_ROUNDS}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-x-5 gap-y-2">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">You</p>
          <p className="text-xl font-black text-amber-300">{myScore}</p>
        </div>
        {others.map((p) => (
          <div key={p.id} className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.label}</p>
            <p className="text-xl font-black text-slate-200">{p.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
