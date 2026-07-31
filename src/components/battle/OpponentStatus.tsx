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
  if (roundStatus === "picking") return locked ? "Locked in and ready ✅" : "Choosing their cards...";
  if (roundStatus === "prompting") return "Writing art direction...";
  if (roundStatus === "imaging") return "Painting their artwork...";
  if (roundStatus === "judging") return "The judge is deciding...";
  return "Round complete!";
}

export default function OpponentStatus({ roundStatus, players }: Props) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {players.map((p) => (
        <div key={p.id} className="glass flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 text-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <p className="text-sm font-medium text-slate-300">
            <span className="font-semibold text-white">{p.label}: </span>
            {statusMessage(roundStatus, p.locked)}
          </p>
        </div>
      ))}
    </div>
  );
}
