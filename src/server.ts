import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

/* ── Auth endpoint rate limiter (IP-based, in-memory) ─────────────────── */
const _authLimits = new Map<string, { count: number; resetAt: number }>();
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _authLimits) if (now >= v.resetAt) _authLimits.delete(k);
  }, 60_000);
}
function authRateLimit(ip: string, maxReq = 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = _authLimits.get(ip);
  if (!entry || now >= entry.resetAt) { _authLimits.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= maxReq) return false;
  entry.count++;
  return true;
}
function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
function tooManyRequests(): Response {
  return Response.json(
    { error: "Too many requests. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": "900" } },
  );
}

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

async function handleEmailRegister(request: Request): Promise<Response> {
  if (!authRateLimit(getClientIp(request), 5, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string; displayName?: string } | null;
    if (!body?.email || !body?.password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }
    const { registerEmailUser } = await import("./lib/email-auth");
    const result = await registerEmailUser(body.email, body.password, body.displayName);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    const { saveSession } = await import("./integrations/replit/auth");
    const sessionId = crypto.randomUUID();
    await saveSession(sessionId, result.userId);
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    const res = Response.json({ ok: true });
    res.headers.append("Set-Cookie", `termly_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
    return res;
  } catch (e) {
    console.error("[email register]", e);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}

async function handleEmailLogin(request: Request): Promise<Response> {
  if (!authRateLimit(getClientIp(request), 10, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
    if (!body?.email || !body?.password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }
    const { loginEmailUser } = await import("./lib/email-auth");
    const result = await loginEmailUser(body.email, body.password);
    if ("error" in result) return Response.json({ error: result.error }, { status: 401 });
    const { saveSession } = await import("./integrations/replit/auth");
    const sessionId = crypto.randomUUID();
    await saveSession(sessionId, result.userId);
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    const res = Response.json({ ok: true });
    res.headers.append("Set-Cookie", `termly_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
    return res;
  } catch (e) {
    console.error("[email login]", e);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}

/* ── Google OAuth ─────────────────────────────────────────────────────── */
async function handleGoogleLogin(request: Request): Promise<Response> {
  try {
    const { getGoogleOAuthUrl } = await import("./lib/google-auth");
    const origin = new URL(request.url).origin;
    const callbackUrl = `${origin}/api/auth/google/callback`;
    const { url, state } = getGoogleOAuthUrl(callbackUrl);

    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    const res = new Response(null, { status: 302, headers: { Location: url } });
    res.headers.append(
      "Set-Cookie",
      `termly_google_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    );
    return res;
  } catch (e) {
    console.error("[google login]", e);
    return new Response(null, { status: 302, headers: { Location: "/login?error=google_unavailable" } });
  }
}

async function handleGoogleCallback(request: Request): Promise<Response> {
  try {
    const { handleGoogleCode, findOrCreateGoogleUser } = await import("./lib/google-auth");
    const { saveSession } = await import("./integrations/replit/auth");

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieHeader = request.headers.get("cookie");
    const savedState = getCookie(cookieHeader, "termly_google_state");

    if (!code || !state || state !== savedState) {
      return new Response(null, { status: 302, headers: { Location: "/login?error=google_failed" } });
    }

    const callbackUrl = `${url.origin}/api/auth/google/callback`;
    const googleUser = await handleGoogleCode(code, callbackUrl);
    const { userId } = await findOrCreateGoogleUser(googleUser);

    const sessionId = crypto.randomUUID();
    await saveSession(sessionId, userId);

    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    const res = new Response(null, { status: 302, headers: { Location: "/app" } });
    res.headers.append(
      "Set-Cookie",
      `termly_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`,
    );
    res.headers.append("Set-Cookie", `termly_google_state=; Path=/; HttpOnly; Max-Age=0`);
    return res;
  } catch (e) {
    console.error("[google callback]", e);
    return new Response(null, { status: 302, headers: { Location: "/login?error=google_failed" } });
  }
}

/* ── Email Password Reset ─────────────────────────────────────────────── */
async function handleEmailResetRequest(request: Request): Promise<Response> {
  if (!authRateLimit(getClientIp(request), 3, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const body = await request.json().catch(() => null) as { email?: string } | null;
    if (!body?.email) return Response.json({ error: "Email required" }, { status: 400 });
    const { createPasswordResetToken } = await import("./lib/email-auth");
    const result = await createPasswordResetToken(body.email);
    // Always return ok:true to prevent email enumeration;
    // only include token if the email was found
    if ("error" in result) return Response.json({ ok: true, token: null });
    return Response.json({ ok: true, token: result.token });
  } catch (e) {
    console.error("[reset request]", e);
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}

async function handleEmailReset(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => null) as { token?: string; password?: string } | null;
    if (!body?.token || !body?.password) {
      return Response.json({ error: "Token and password required" }, { status: 400 });
    }
    const { resetPasswordWithToken } = await import("./lib/email-auth");
    const result = await resetPasswordWithToken(body.token, body.password);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[reset password]", e);
    return Response.json({ error: "Reset failed" }, { status: 500 });
  }
}

async function handleEmailChangePassword(request: Request): Promise<Response> {
  if (!authRateLimit(getClientIp(request), 5, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const sessionId = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith("termly_sid="))?.slice("termly_sid=".length);
    if (!sessionId) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const { getPool } = await import("./integrations/replit/db");
    const { rows: sessRows } = await getPool().query(`SELECT user_id FROM user_sessions WHERE session_id=$1 AND expires_at > NOW()`, [sessionId]);
    if (!sessRows[0]) return Response.json({ error: "Session expired" }, { status: 401 });
    const userId = (sessRows[0] as { user_id: string }).user_id;

    const body = await request.json().catch(() => null) as { oldPassword?: string; newPassword?: string } | null;
    if (!body?.oldPassword || !body?.newPassword) {
      return Response.json({ error: "oldPassword and newPassword required" }, { status: 400 });
    }

    const { changePassword } = await import("./lib/email-auth");
    const result = await changePassword(userId, body.oldPassword, body.newPassword);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[change password]", e);
    return Response.json({ error: "Change password failed" }, { status: 500 });
  }
}

/* ── Periodic DB session cleanup (runs once per process lifetime) ─────── */
if (typeof setInterval !== "undefined") {
  const SESSION_CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // every 6 hours
  setInterval(async () => {
    try {
      const { cleanupExpiredSessions } = await import("./integrations/replit/auth");
      const n = await cleanupExpiredSessions();
      if (n > 0) console.info(`[session-cleanup] removed ${n} expired session(s)`);
    } catch (e) {
      console.warn("[session-cleanup] failed:", e);
    }
  }, SESSION_CLEANUP_INTERVAL);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api/auth/login") return await handleAuthLogin(request);
      if (path === "/api/auth/callback") return await handleAuthCallback(request);
      if (path === "/api/auth/logout") return await handleAuthLogout(request);
      if (path === "/api/auth/email/register" && request.method === "POST") return await handleEmailRegister(request);
      if (path === "/api/auth/email/login" && request.method === "POST") return await handleEmailLogin(request);
      if (path === "/api/auth/google") return await handleGoogleLogin(request);
      if (path === "/api/auth/google/callback") return await handleGoogleCallback(request);
      if (path === "/api/auth/email/reset-request" && request.method === "POST") return await handleEmailResetRequest(request);
      if (path === "/api/auth/email/reset" && request.method === "POST") return await handleEmailReset(request);
      if (path === "/api/auth/email/change-password" && request.method === "POST") return await handleEmailChangePassword(request);

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
