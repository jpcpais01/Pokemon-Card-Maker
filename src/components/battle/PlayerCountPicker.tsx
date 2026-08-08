"use client";

import Segmented from "@/components/ui/Segmented";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/battle/types";

interface Props {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}

const OPTIONS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
  const n = MIN_PLAYERS + i;
  return { value: n, label: String(n) };
});

export default function PlayerCountPicker({ value, onChange, label = "Players" }: Props) {
  // One row of single digits - it reads as a scale from 2 to 6, which wrapping onto a
  // second row would break.
  return (
    <Segmented label={label} options={OPTIONS} value={value} onChange={onChange} columns={OPTIONS.length} />
  );
}
