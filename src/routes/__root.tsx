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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
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
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Termly — مستشارك الأكاديمي الذكي" },
      { name: "twitter:description", content: "خطط، تتبع وتفوق في معدلك التراكمي مع Termly." },
      { property: "og:image", content: "https://gpacalcu.lovable.app/icon-512.png" },
      { name: "twitter:image", content: "https://gpacalcu.lovable.app/icon-512.png" },
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
