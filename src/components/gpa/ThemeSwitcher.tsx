import type { GpaTheme } from "./use-theme";

const OPTS: { id: GpaTheme; icon: string; label: string }[] = [
  { id: "dark", icon: "🌙", label: "داكن" },
  { id: "light", icon: "☀️", label: "فاتح" },
  { id: "hc", icon: "⊞", label: "تباين" },
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
        background: "var(--gpa-surface-alpha-06)",
        border: "1px solid var(--gpa-border)",
        borderRadius: 12,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
              fontSize: 13,
              cursor: "pointer",
              background: active
                ? "linear-gradient(135deg, var(--gpa-accent-20), var(--gpa-accent2-18))"
                : "transparent",
              color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
              border: active ? "1px solid var(--gpa-accent-33)" : "1px solid transparent",
              borderRadius: 9,
              fontWeight: 700,
              minWidth: 34,
              transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
              boxShadow: active ? "0 1px 8px var(--gpa-accent-15)" : "none",
            }}
          >
            <span aria-hidden>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
