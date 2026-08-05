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

/** Scoreboard + round progress. The round dots turn "Round 3 / 5" into something
 *  you can read at a glance without parsing text. */
export default function BattleHeader({ round, myScore, others }: Props) {
  const leader = Math.max(myScore, ...others.map((p) => p.score));

  return (
    <div className="card mb-5 px-4 py-3">
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: BATTLE_ROUNDS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i + 1 < round ? "w-4 bg-amber-300/50" : i + 1 === round ? "w-7 bg-amber-300" : "w-4 bg-white/12"
            }`}
          />
        ))}
        <span className="ml-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
          Round {round}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-center gap-x-6 gap-y-2">
        <div className="text-center">
          <p className="text-[9.5px] font-black uppercase tracking-wider text-amber-300/70">You</p>
          <p
            className={`font-display text-2xl font-black tabular-nums ${
              myScore === leader && leader > 0 ? "text-amber-300" : "text-white"
            }`}
          >
            {myScore}
          </p>
        </div>
        {others.map((p) => (
          <div key={p.id} className="text-center">
            <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">{p.label}</p>
            <p
              className={`font-display text-2xl font-black tabular-nums ${
                p.score === leader && leader > 0 ? "text-slate-100" : "text-slate-400"
              }`}
            >
              {p.score}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
