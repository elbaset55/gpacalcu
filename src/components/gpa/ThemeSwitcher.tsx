import type { GpaTheme } from "./use-theme";

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

const OPTS: { id: GpaTheme; icon: string; label: string }[] = [
  { id: "dark", icon: "🌙", label: "داكن" },
  { id: "light", icon: "☀️", label: "فاتح" },
  { id: "hc", icon: "🔲", label: "تباين" },
];

export function ThemeSwitcher({
  theme,
  onChange,
}: {
  theme: GpaTheme;
  onChange: (t: GpaTheme) => void;
}) {
  return (
    <div
      className="gpa-no-print"
      role="radiogroup"
      aria-label="اختيار الثيم"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--gpa-card)",
        border: "1px solid var(--gpa-border)",
        borderRadius: 12,
      }}
    >
      {OPTS.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.id)}
            style={{
              padding: "6px 10px",
              fontSize: 14,
              fontFamily: FONT,
              cursor: "pointer",
              background: active ? "var(--gpa-accent-20)" : "transparent",
              color: active ? "var(--gpa-accent)" : "var(--gpa-text-muted)",
              border: active ? "1px solid var(--gpa-accent-44)" : "1px solid transparent",
              borderRadius: 9,
              fontWeight: 700,
              minWidth: 36,
            }}
          >
            <span aria-hidden>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
