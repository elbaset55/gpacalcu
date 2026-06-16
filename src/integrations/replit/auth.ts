import * as client from "openid-client";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest as getWebRequest } from "@tanstack/react-start/server";
import { query } from "@/integrations/replit/db";

let _oidcConfig: client.Configuration | undefined;

async function getOidcConfig() {
  if (!_oidcConfig) {
    _oidcConfig = await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
    );
  }
  return _oidcConfig;
}

export interface ReplitUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

async function getUserFromSession(sessionId: string): Promise<ReplitUser | null> {
  const { rows } = await query(
    `SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()`,
    [sessionId],
  );
  if (!rows[0]) return null;
  const sess = rows[0].sess as { userId?: string };
  if (!sess?.userId) return null;
  const { rows: userRows } = await query(
    `SELECT id, email, first_name, last_name, profile_image_url FROM replit_users WHERE id = $1`,
    [sess.userId],
  );
  if (!userRows[0]) return null;
  const u = userRows[0] as Record<string, string | null>;
  return {
    id: u.id as string,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    profileImageUrl: u.profile_image_url,
  };
}

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)termly_sid=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const requireReplitAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getWebRequest();
    if (!request?.headers) throw new Error("Unauthorized");

    const sessionId = getSessionId(request);
    if (!sessionId) throw new Error("Unauthorized");

    const user = await getUserFromSession(sessionId);
    if (!user) throw new Error("Unauthorized");

    return next({ context: { userId: user.id, user } });
  },
);

export async function buildLoginUrl(hostname: string): Promise<string> {
  const config = await getOidcConfig();
  const state = crypto.randomUUID();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: `https://${hostname}/api/auth/callback`,
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return url.href + `|${state}|${codeVerifier}`;
}

export async function handleCallback(
  hostname: string,
  searchParams: URLSearchParams,
  state: string,
  codeVerifier: string,
): Promise<ReplitUser> {
  const config = await getOidcConfig();
  const callbackUrl = new URL(
    `https://${hostname}/api/auth/callback?${searchParams.toString()}`,
  );
  const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState: state,
  });
  const claims = tokens.claims()!;
  const user: ReplitUser = {
    id: claims.sub,
    email: (claims.email as string) ?? null,
    firstName: (claims.first_name as string) ?? null,
    lastName: (claims.last_name as string) ?? null,
    profileImageUrl: (claims.profile_image_url as string) ?? null,
  };

  await query(
    `INSERT INTO replit_users (id, email, first_name, last_name, profile_image_url, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (id) DO UPDATE SET
       email=EXCLUDED.email,
       first_name=EXCLUDED.first_name,
       last_name=EXCLUDED.last_name,
       profile_image_url=EXCLUDED.profile_image_url,
       updated_at=NOW()`,
    [user.id, user.email, user.firstName, user.lastName, user.profileImageUrl],
  );

  return user;
}

export async function saveSession(sessionId: string, userId: string): Promise<void> {
  await query(
    `INSERT INTO sessions (sid, sess, expire)
     VALUES ($1, $2::jsonb, NOW() + INTERVAL '7 days')
     ON CONFLICT (sid) DO UPDATE SET sess=$2::jsonb, expire=NOW() + INTERVAL '7 days'`,
    [sessionId, JSON.stringify({ userId })],
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE sid = $1`, [sessionId]);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await query(
    `DELETE FROM sessions WHERE sess->>'userId' = $1`,
    [userId],
  );
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query(`DELETE FROM sessions WHERE expire <= NOW()`);
  return result.rowCount ?? 0;
}

export async function getLogoutUrl(hostname: string): Promise<string> {
  const config = await getOidcConfig();
  return client.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: `https://${hostname}`,
  }).href;
}

export const requireSupabaseAuth = requireReplitAuth;
