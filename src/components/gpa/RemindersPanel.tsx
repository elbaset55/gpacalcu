import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addReminder, deleteReminder, listReminders, toggleReminder } from "@/lib/reminders.functions";

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

export function RemindersPanel({ lang, onClose }: { lang: "ar" | "en"; onClose: () => void }) {
  const ar = lang === "ar";
  const list = useServerFn(listReminders);
  const add = useServerFn(addReminder);
  const tog = useServerFn(toggleReminder);
  const del = useServerFn(deleteReminder);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["reminders"], queryFn: () => list() });
  const inval = () => qc.invalidateQueries({ queryKey: ["reminders"] });
  const addM = useMutation({ mutationFn: (v: { title: string; body: string; due_at: string; kind: string }) => add({ data: v }), onSuccess: inval });
  const togM = useMutation({ mutationFn: (v: { id: string; done: boolean }) => tog({ data: v }), onSuccess: inval });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: inval });

  const [title, setTitle] = useState("");
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Browser notification permission request once
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Trigger local notifications for items due in the next minute
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const now = Date.now();
    data.forEach((r) => {
      if (r.done) return;
      const t = new Date(r.due_at).getTime();
      const diff = t - now;
      if (diff > 0 && diff < 60_000) {
        new Notification(r.title, { body: r.body, icon: "/icon-512.png" });
      }
    });
  }, [data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addM.mutate({ title: title.trim(), body: "", due_at: new Date(due).toISOString(), kind: "general" });
    setTitle("");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: "var(--gpa-text)" }}>⏰ {ar ? "التذكيرات" : "Reminders"}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--gpa-border)", color: "var(--gpa-text-faint)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: FONT }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ar ? "عنوان التذكير (مثال: امتحان رياضيات)" : "Reminder title"}
            style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 10, color: "var(--gpa-text-strong)", padding: "10px 12px", fontSize: 13, fontFamily: FONT }} />
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)}
            style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 10, color: "var(--gpa-text-strong)", padding: "10px 12px", fontSize: 13, fontFamily: FONT }} />
          <button type="submit" disabled={addM.isPending} style={{ padding: 11, background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", color: "var(--gpa-accent)", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
            ＋ {ar ? "إضافة" : "Add"}
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--gpa-text-faint)", fontSize: 12, padding: 24 }}>
              {ar ? "لا توجد تذكيرات بعد" : "No reminders yet"}
            </div>
          )}
          {data.map((r) => {
            const past = new Date(r.due_at).getTime() < Date.now();
            return (
              <div key={r.id} style={{
                display: "flex", gap: 8, alignItems: "center",
                background: "var(--gpa-surface-alpha-06)",
                border: `1px solid ${r.done ? "var(--gpa-border)" : past ? "var(--gpa-danger-33)" : "var(--gpa-border)"}`,
                borderRadius: 10, padding: 10, opacity: r.done ? 0.5 : 1,
              }}>
                <input type="checkbox" checked={r.done} onChange={(e) => togM.mutate({ id: r.id, done: e.target.checked })} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--gpa-text-strong)", textDecoration: r.done ? "line-through" : "none", fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: past && !r.done ? "var(--gpa-danger)" : "var(--gpa-text-faint)", marginTop: 2 }}>
                    {new Date(r.due_at).toLocaleString(ar ? "ar-EG" : "en-US")}
                  </div>
                </div>
                <button onClick={() => delM.mutate(r.id)} style={{ background: "transparent", border: "none", color: "var(--gpa-text-faint)", cursor: "pointer", fontSize: 14 }}>🗑</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
