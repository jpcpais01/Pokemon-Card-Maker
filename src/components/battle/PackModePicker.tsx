"use client";

import Segmented from "@/components/ui/Segmented";
import type { PackMode } from "@/lib/types";

interface Props {
  value: PackMode;
  onChange: (mode: PackMode) => void;
}

const OPTIONS: { value: PackMode; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "sir", label: "Only SIRs" },
  { value: "tagteam", label: "Tag Teams" },
  { value: "tagteamsir", label: "Tag Team SIRs" },
  { value: "tripletagteamsir", label: "Triple Tag SIRs" },
];

const HELP: Partial<Record<PackMode, string>> = {
  sir: "Every pack is a Special Illustration Rare — art type is locked in for everyone.",
  tagteam: "Every pack pairs up two Pokemon — special form is locked in for everyone.",
  tagteamsir: "Every pack is a Special Illustration Rare Tag Team — art type and special form are both locked in.",
  tripletagteamsir:
    "Every pack is a Special Illustration Rare Triple Tag Team — art type and special form are both locked in.",
};

export default function PackModePicker({ value, onChange }: Props) {
  return (
    <Segmented
      label="Pack type"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      columns={2}
      spanLast
      help={HELP[value]}
    />
  );
}
