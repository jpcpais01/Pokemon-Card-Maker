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
  // Five per row: the full 2-10 range in one row would be ~34px a cell on a phone, and the
  // numbers still read as a scale when they wrap at a consistent width.
  return <Segmented label={label} options={OPTIONS} value={value} onChange={onChange} columns={5} />;
}
