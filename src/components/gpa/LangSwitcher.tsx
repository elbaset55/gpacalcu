import type { Lang } from "@/lib/use-lang";

export function LangSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const opts: { v: Lang; l: string }[] = [
    { v: "ar", l: "العربية" },
    { v: "en", l: "English" },
  ];
  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        background: "var(--gpa-card)",
        border: "1px solid var(--gpa-border)",
        borderRadius: 10,
      }}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          aria-pressed={lang === o.v}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            background: lang === o.v ? "var(--gpa-accent-20)" : "transparent",
            color: lang === o.v ? "var(--gpa-accent)" : "var(--gpa-text-muted-2)",
            fontFamily: "'Cairo','Noto Sans Arabic',sans-serif",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
