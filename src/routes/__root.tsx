import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

const pageStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--gpa-bg, #f8fafc)",
  padding: "1rem",
  fontFamily: "'Manrope','Cairo','Noto Sans Arabic',sans-serif",
};
const boxStyles: React.CSSProperties = {
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
  padding: "2.5rem 2rem",
  background: "var(--gpa-card, #ffffff)",
  borderRadius: 18,
  border: "1px solid var(--gpa-border, #e2e8f0)",
  boxShadow: "0 8px 40px rgba(0,0,0,.06)",
};
const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 22px",
  background: "var(--gpa-accent, #2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: "var(--gpa-text-soft, #475569)",
  border: "1px solid var(--gpa-border, #e2e8f0)",
};

function NotFoundComponent() {
  return (
    <div style={pageStyles}>
      <div style={boxStyles}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🔍</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "var(--gpa-text, #0f172a)" }}>404 — صفحة غير موجودة</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--gpa-text-faint, #94a3b8)", lineHeight: 1.7 }}>
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <a href="/" style={btnPrimary}>← الرئيسية</a>
      </div>
    </div>
  );
}

function PendingComponent() {
  return (
    <div style={pageStyles}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid var(--gpa-accent-12, rgba(37,99,235,.12))",
          borderTopColor: "var(--gpa-accent, #2563eb)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <div style={{ fontSize: 13, color: "var(--gpa-text-faint, #94a3b8)", fontFamily: "inherit" }}>جاري التحميل...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div style={pageStyles}>
      <div style={boxStyles}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "var(--gpa-text, #0f172a)" }}>حدث خطأ غير متوقع</h1>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--gpa-text-faint, #94a3b8)", lineHeight: 1.7 }}>
          يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.
        </p>
        {error?.message && (
          <pre style={{ fontSize: 10, color: "var(--gpa-danger, #ef4444)", background: "var(--gpa-danger-08, rgba(239,68,68,.08))", padding: "8px 12px", borderRadius: 8, margin: "12px 0", overflowX: "auto", textAlign: "start", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {error.message}
          </pre>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={() => { router.invalidate(); reset(); }}>حاول مجدداً</button>
          <a href="/" style={btnSecondary}>الرئيسية</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Termly — مستشارك الأكاديمي الذكي" },
      {
        name: "description",
        content:
          "Termly: خطط، تتبع وتفوق في معدلك التراكمي. حاسبة GPA متقدمة بالذكاء الاصطناعي لطلاب جامعة بنها والجامعات المصرية.",
      },
      { name: "author", content: "Termly" },
      { property: "og:title", content: "Termly — مستشارك الأكاديمي الذكي" },
      { property: "og:description", content: "خطط، تتبع وتفوق في معدلك التراكمي مع Termly." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Termly" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Termly — مستشارك الأكاديمي الذكي" },
      { name: "twitter:description", content: "خطط، تتبع وتفوق في معدلك التراكمي مع Termly." },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: "#2563eb" },
      { property: "og:image", content: "/icon-512.png" },
      { name: "twitter:image", content: "/icon-512.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-gpa-theme="light" suppressHydrationWarning>
      <head>
        {/* Blocking theme + lang detection — runs before CSS, eliminates hydration flicker */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('gpa-theme');if(t==='dark'||t==='light'||t==='hc'){document.documentElement.setAttribute('data-gpa-theme',t);}else if(window.matchMedia('(prefers-contrast: more)').matches){document.documentElement.setAttribute('data-gpa-theme','hc');}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-gpa-theme','dark');}var l=localStorage.getItem('gpa-lang');if(l==='en'){document.documentElement.dir='ltr';document.documentElement.lang='en';}else{document.documentElement.dir='rtl';document.documentElement.lang='ar';}}catch(e){}})();` }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
