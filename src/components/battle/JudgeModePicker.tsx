"use client";

import Segmented from "@/components/ui/Segmented";
import type { JudgeMode } from "@/lib/battle/types";

interface Props {
  value: JudgeMode;
  onChange: (mode: JudgeMode) => void;
}

const OPTIONS: { value: JudgeMode; label: string }[] = [
  { value: "ai", label: "AI Judge" },
  { value: "vote", label: "Player Vote" },
];

export default function JudgeModePicker({ value, onChange }: Props) {
  return (
    <Segmented
      label="Round judge"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      columns={2}
      help={value === "vote" ? "Everyone votes anonymously on a card that isn't their own." : undefined}
    />
  );
}
