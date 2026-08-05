"use client";

export interface SegmentedOption<T> {
  value: T;
  label: string;
  /** Optional second line inside the segment (e.g. a region under a gen name). */
  hint?: string;
}

interface Props<T> {
  label?: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Grid columns. Defaults to the option count, capped at 3. */
  columns?: number;
  /** Explanatory line under the control, usually describing the current choice. */
  help?: string;
  /** Let the final option span the full row when the count is odd. */
  spanLast?: boolean;
}

/**
 * One shared "pick exactly one" control. Every settings picker in the app
 * (players, game mode, judge, rerolls) previously duplicated the same
 * selected/unselected button markup; they all render through this now, so the
 * selected state is defined once in the `seg` / `seg-on` utilities.
 */
export default function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
  help,
  spanLast,
}: Props<T>) {
  const cols = columns ?? Math.min(options.length, 3);

  return (
    <div>
      {label && <p className="section-label mb-2">{label}</p>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {options.map((opt, i) => {
          const on = opt.value === value;
          const spans = spanLast && i === options.length - 1 && options.length % cols === 1;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={on}
              className={`seg flex-col ${on ? "seg-on" : ""} ${spans ? `col-span-${cols}` : ""}`}
              style={spans ? { gridColumn: `span ${cols} / span ${cols}` } : undefined}
            >
              <span className="leading-tight">{opt.label}</span>
              {opt.hint && (
                <span className="mt-0.5 text-[10px] font-semibold opacity-70">{opt.hint}</span>
              )}
            </button>
          );
        })}
      </div>
      {help && <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">{help}</p>}
    </div>
  );
}
