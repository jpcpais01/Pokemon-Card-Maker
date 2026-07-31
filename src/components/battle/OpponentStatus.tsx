import type { RoundStatus } from "@/lib/battle/types";

interface Props {
  roundStatus: RoundStatus;
  opponentLocked: boolean;
  opponentLabel?: string;
}

function statusMessage(roundStatus: RoundStatus, opponentLocked: boolean): string {
  if (roundStatus === "picking") return opponentLocked ? "Locked in and ready ✅" : "Choosing their cards...";
  if (roundStatus === "prompting") return "Writing art direction...";
  if (roundStatus === "imaging") return "Painting their artwork...";
  if (roundStatus === "judging") return "The judge is deciding...";
  return "Round complete!";
}

export default function OpponentStatus({ roundStatus, opponentLocked, opponentLabel = "Opponent" }: Props) {
  return (
    <div className="glass mt-4 flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 text-center">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      <p className="text-sm font-medium text-slate-300">
        <span className="font-semibold text-white">{opponentLabel}: </span>
        {statusMessage(roundStatus, opponentLocked)}
      </p>
    </div>
  );
}
