import type { RoundStatus } from "@/lib/battle/types";

export interface OpponentStatusPlayer {
  id: string;
  label: string;
  locked: boolean;
}

interface Props {
  roundStatus: RoundStatus;
  players: OpponentStatusPlayer[];
}

function statusMessage(roundStatus: RoundStatus, locked: boolean): string {
  if (roundStatus === "picking") return locked ? "Locked in and ready" : "Choosing their cards...";
  if (roundStatus === "prompting") return "Writing art direction...";
  if (roundStatus === "imaging") return "Painting their artwork...";
  if (roundStatus === "judging") return "The judge is deciding...";
  return "Round complete";
}

export default function OpponentStatus({ roundStatus, players }: Props) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {players.map((p) => {
        const done = roundStatus === "picking" && p.locked;
        return (
          <div key={p.id} className="card flex items-center gap-3 px-4 py-3">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                done ? "bg-emerald-400" : "animate-pulse bg-amber-400"
              }`}
            />
            <p className="min-w-0 text-[13px] text-slate-400">
              <span className="font-bold text-white">{p.label}</span>
              <span className="mx-1.5 text-slate-600">·</span>
              {statusMessage(roundStatus, p.locked)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
