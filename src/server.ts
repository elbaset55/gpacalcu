import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleAuthLogin(request: Request): Promise<Response> {
  const { buildLoginUrl } = await import("./integrations/replit/auth");
  const hostname = new URL(request.url).hostname;
  const result = await buildLoginUrl(hostname);
  const pipeIdx = result.indexOf("|");
  const pipe2Idx = result.indexOf("|", pipeIdx + 1);
  const url = result.substring(0, pipeIdx);
  const state = result.substring(pipeIdx + 1, pipe2Idx);
  const codeVerifier = result.substring(pipe2Idx + 1);

  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd ? "; Secure" : "";
  const response = new Response(null, {
    status: 302,
    headers: { Location: url },
  });
  response.headers.append(
    "Set-Cookie",
    `termly_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
  );
  response.headers.append(
    "Set-Cookie",
    `termly_code_verifier=${encodeURIComponent(codeVerifier)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
  );
  return response;
}

async function handleAuthCallback(request: Request): Promise<Response> {
  const { handleCallback, saveSession } = await import("./integrations/replit/auth");
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie");
  const state = getCookie(cookieHeader, "termly_oauth_state");
  const codeVerifier = getCookie(cookieHeader, "termly_code_verifier");

  if (!state || !codeVerifier) {
    return new Response("Missing auth state", { status: 400 });
  }

  try {
    const user = await handleCallback(url.hostname, url.searchParams, state, codeVerifier);
    const sessionId = crypto.randomUUID();
    await saveSession(sessionId, user.id);

    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    const response = new Response(null, {
      status: 302,
      headers: { Location: "/app" },
    });
    response.headers.append(
      "Set-Cookie",
      `termly_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`,
    );
    response.headers.append("Set-Cookie", `termly_oauth_state=; Path=/; HttpOnly; Max-Age=0`);
    response.headers.append("Set-Cookie", `termly_code_verifier=; Path=/; HttpOnly; Max-Age=0`);
    return response;
  } catch (e) {
    console.error("[auth callback]", e);
    return new Response(null, { status: 302, headers: { Location: "/login?error=auth_failed" } });
  }
}

async function handleAuthLogout(request: Request): Promise<Response> {
  const { deleteSession, getLogoutUrl } = await import("./integrations/replit/auth");
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie");
  const sessionId = getCookie(cookieHeader, "termly_sid");

  if (sessionId) {
    await deleteSession(sessionId).catch(() => {});
  }

  let logoutUrl = "/login";
  try {
    logoutUrl = await getLogoutUrl(url.hostname);
  } catch {}

  const response = new Response(null, {
    status: 302,
    headers: { Location: logoutUrl },
  });
  response.headers.append("Set-Cookie", `termly_sid=; Path=/; HttpOnly; Max-Age=0`);
  return response;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api/auth/login") return await handleAuthLogin(request);
      if (path === "/api/auth/callback") return await handleAuthCallback(request);
      if (path === "/api/auth/logout") return await handleAuthLogout(request);

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
