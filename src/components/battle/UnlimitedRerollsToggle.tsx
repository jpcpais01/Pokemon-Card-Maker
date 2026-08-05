"use client";

import Segmented from "@/components/ui/Segmented";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

const OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "unlimited", label: "Unlimited ∞" },
];

export default function UnlimitedRerollsToggle({ value, onChange }: Props) {
  return (
    <Segmented
      label="Rerolls"
      options={OPTIONS}
      value={value ? "unlimited" : "standard"}
      onChange={(v) => onChange(v === "unlimited")}
      columns={2}
      help={value ? "Reroll any trait as many times as you like each round." : undefined}
    />
  );
}
