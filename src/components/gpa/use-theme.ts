import { useCallback, useEffect, useState } from "react";

export type GpaTheme = "dark" | "light" | "hc";
const KEY = "gpa-theme";

function detect(): GpaTheme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(KEY) as GpaTheme | null;
  if (saved === "dark" || saved === "light" || saved === "hc") return saved;
  if (window.matchMedia?.("(prefers-contrast: more)").matches) return "hc";
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function useGpaTheme() {
  const [theme, setThemeState] = useState<GpaTheme>("dark");

  useEffect(() => {
    const t = detect();
    setThemeState(t);
    document.documentElement.setAttribute("data-gpa-theme", t);
  }, []);

  const setTheme = useCallback((t: GpaTheme) => {
    setThemeState(t);
    localStorage.setItem(KEY, t);
    document.documentElement.setAttribute("data-gpa-theme", t);
  }, []);

  return { theme, setTheme };
}
