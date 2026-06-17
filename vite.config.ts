import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import type { Plugin } from "vite";

function authRoutesPlugin(): Plugin {
  return {
    name: "termly-auth-routes",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const path = url.split("?")[0];

        if (
          path !== "/api/auth/login" &&
          path !== "/api/auth/callback" &&
          path !== "/api/auth/logout"
        ) {
          return next();
        }

        try {
          const fullUrl = `http://${req.headers.host ?? "localhost:5000"}${url}`;
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers[k] = v;
            else if (Array.isArray(v)) headers[k] = v.join(", ");
          }
          const request = new Request(fullUrl, { method: req.method ?? "GET", headers });

          let response: Response;
          if (path === "/api/auth/login") {
            const { buildLoginUrl } = await server.ssrLoadModule("./src/integrations/replit/auth");
            const result = await buildLoginUrl(new URL(fullUrl).hostname);
            const pipeIdx = result.indexOf("|");
            const pipe2Idx = result.indexOf("|", pipeIdx + 1);
            const redirectUrl = result.substring(0, pipeIdx);
            const state = result.substring(pipeIdx + 1, pipe2Idx);
            const codeVerifier = result.substring(pipe2Idx + 1);
            const isProd = process.env.NODE_ENV === "production";
            const secure = isProd ? "; Secure" : "";
            res.writeHead(302, {
              Location: redirectUrl,
              "Set-Cookie": [
                `termly_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
                `termly_code_verifier=${encodeURIComponent(codeVerifier)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
              ],
            });
            res.end();
            return;
          }

          if (path === "/api/auth/callback") {
            const reqUrl = new URL(fullUrl);
            const cookieHeader = (req.headers.cookie ?? "") as string;
            const getCookie = (name: string) => {
              const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
              return match ? decodeURIComponent(match[1]) : null;
            };
            const state = getCookie("termly_oauth_state");
            const codeVerifier = getCookie("termly_code_verifier");
            if (!state || !codeVerifier) {
              res.writeHead(400);
              res.end("Missing auth state");
              return;
            }
            try {
              const { handleCallback, saveSession } = await server.ssrLoadModule("./src/integrations/replit/auth");
              const user = await handleCallback(reqUrl.hostname, reqUrl.searchParams, state, codeVerifier);
              const sessionId = crypto.randomUUID();
              await saveSession(sessionId, user.id);
              const isProd = process.env.NODE_ENV === "production";
              const secure = isProd ? "; Secure" : "";
              res.writeHead(302, {
                Location: "/app",
                "Set-Cookie": [
                  `termly_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`,
                  `termly_oauth_state=; Path=/; HttpOnly; Max-Age=0`,
                  `termly_code_verifier=; Path=/; HttpOnly; Max-Age=0`,
                ],
              });
              res.end();
            } catch (e) {
              console.error("[auth callback]", e);
              res.writeHead(302, { Location: "/login?error=auth_failed" });
              res.end();
            }
            return;
          }

          if (path === "/api/auth/logout") {
            const reqUrl = new URL(fullUrl);
            const cookieHeader = (req.headers.cookie ?? "") as string;
            const match = cookieHeader.match(/(?:^|;\s*)termly_sid=([^;]+)/);
            const sessionId = match ? decodeURIComponent(match[1]) : null;
            let logoutUrl = "/login";
            try {
              const { deleteSession, getLogoutUrl } = await server.ssrLoadModule("./src/integrations/replit/auth");
              if (sessionId) await deleteSession(sessionId).catch(() => {});
              logoutUrl = await getLogoutUrl(reqUrl.hostname);
            } catch (e) {
              console.error("[auth logout]", e);
            }
            res.writeHead(302, {
              Location: logoutUrl,
              "Set-Cookie": `termly_sid=; Path=/; HttpOnly; Max-Age=0`,
            });
            res.end();
            return;
          }
        } catch (e) {
          console.error("[auth middleware]", e);
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    authRoutesPlugin(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "src/server.ts" },
      serverFns: { disableCsrfMiddlewareWarning: true },
    }),
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  ssr: {
    noExternal: ["openid-client"],
    external: ["pg", "pg-native", "pg-pool"],
  },
  optimizeDeps: {
    exclude: ["pg", "pg-native"],
  },
});
