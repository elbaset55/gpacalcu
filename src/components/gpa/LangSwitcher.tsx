import type { Lang } from "@/lib/use-lang";

const FONT = "'Plus Jakarta Sans','Cairo','Noto Sans Arabic',sans-serif";

export function LangSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const opts: { v: Lang; l: string }[] = [
    { v: "ar", l: "عربي" },
    { v: "en", l: "EN" },
  ];
  return (
    <div
      role="group"
      aria-label="Language"
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
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          aria-pressed={lang === o.v}
          style={{
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 9,
            border: lang === o.v ? "1px solid var(--gpa-accent-33)" : "1px solid transparent",
            cursor: "pointer",
            background: lang === o.v
              ? "linear-gradient(135deg, var(--gpa-accent-20), var(--gpa-accent2-18))"
              : "transparent",
            color: lang === o.v ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
            fontFamily: FONT,
            transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            boxShadow: lang === o.v ? "0 1px 8px var(--gpa-accent-15)" : "none",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
