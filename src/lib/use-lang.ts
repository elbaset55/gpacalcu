import { useCallback, useEffect, useState } from "react";

export type Lang = "ar" | "en";
const KEY = "gpa-lang";

function detect(): Lang {
  if (typeof window === "undefined") return "ar";
  const v = localStorage.getItem(KEY);
  return v === "en" ? "en" : "ar";
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => {
    const l = detect();
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);
  return { lang, setLang };
}
