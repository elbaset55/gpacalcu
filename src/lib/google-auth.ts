/**
 * Google OAuth 2.0 flow — no extra npm packages, just fetch.
 *
 * Required environment variables (add via Replit Secrets):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *
 * In Google Cloud Console → OAuth consent screen → Authorised redirect URIs:
 *   https://<your-replit-dev-domain>/api/auth/google/callback
 *   https://<your-deployed-domain>/api/auth/google/callback
 */
import pg from "pg";

const { Pool } = pg;

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export interface GoogleUser {
  googleId: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

/** Returns { url, state } — caller must store `state` in a short-lived cookie. */
export function getGoogleOAuthUrl(callbackUrl: string): { url: string; state: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state,
  };
}

/** Exchanges an authorisation code for a GoogleUser. */
export async function handleGoogleCode(
  code: string,
  callbackUrl: string,
): Promise<GoogleUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch Google user info");

  const raw = (await userRes.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!raw.id) throw new Error("Google did not return a user id");

  return {
    googleId: raw.id,
    email: raw.email ?? null,
    name: raw.name ?? null,
    picture: raw.picture ?? null,
  };
}

/** Upserts the Google user in the DB and returns the internal userId. */
export async function findOrCreateGoogleUser(
  gu: GoogleUser,
): Promise<{ userId: string }> {
  const pool = getPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS google_users (
        id          TEXT PRIMARY KEY,
        google_id   TEXT NOT NULL UNIQUE,
        email       TEXT,
        name        TEXT,
        picture     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const { rows } = await pool.query(
      `SELECT id FROM google_users WHERE google_id = $1`,
      [gu.googleId],
    );

    let userId: string;
    if (rows[0]) {
      userId = rows[0].id as string;
      await pool.query(
        `UPDATE google_users SET email=$1, name=$2, picture=$3, updated_at=NOW()
         WHERE google_id=$4`,
        [gu.email, gu.name, gu.picture, gu.googleId],
      );
    } else {
      userId = `gu_${crypto.randomUUID().replace(/-/g, "")}`;
      await pool.query(
        `INSERT INTO google_users (id, google_id, email, name, picture)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, gu.googleId, gu.email, gu.name, gu.picture],
      );
    }

    // Mirror into replit_users so the rest of the app (session lookup, profile) works
    const parts = (gu.name ?? "").split(" ");
    const firstName = parts[0] || null;
    const lastName = parts.slice(1).join(" ") || null;
    await pool.query(
      `INSERT INTO replit_users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (id) DO UPDATE SET
         email=EXCLUDED.email,
         first_name=EXCLUDED.first_name,
         last_name=EXCLUDED.last_name,
         profile_image_url=EXCLUDED.profile_image_url,
         updated_at=NOW()`,
      [userId, gu.email, firstName, lastName, gu.picture],
    );

    return { userId };
  } finally {
    await pool.end();
  }
}
