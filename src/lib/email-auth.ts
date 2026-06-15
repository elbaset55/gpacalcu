import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export async function registerEmailUser(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ userId: string } | { error: string }> {
  const pool = getPool();
  try {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return { error: "Invalid email address" };
    if (password.length < 8) return { error: "Password must be at least 8 characters" };

    const { rows: existing } = await pool.query(
      `SELECT id FROM email_users WHERE email = $1`,
      [normalized],
    );
    if (existing.length > 0) return { error: "Email already registered" };

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `eu_${crypto.randomUUID().replace(/-/g, "")}`;

    await pool.query(
      `INSERT INTO email_users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)`,
      [userId, normalized, passwordHash, displayName ?? null],
    );
    const name = displayName ?? normalized.split("@")[0];
    await pool.query(
      `INSERT INTO replit_users (id, email, first_name, updated_at)
       VALUES ($1,$2,$3,NOW()) ON CONFLICT (id) DO NOTHING`,
      [userId, normalized, name],
    );
    return { userId };
  } finally {
    await pool.end();
  }
}

export async function loginEmailUser(
  email: string,
  password: string,
): Promise<{ userId: string } | { error: string }> {
  const pool = getPool();
  try {
    const normalized = email.trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT id, password_hash FROM email_users WHERE email = $1`,
      [normalized],
    );
    if (!rows[0]) return { error: "Invalid email or password" };
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return { error: "Invalid email or password" };
    return { userId: rows[0].id };
  } finally {
    await pool.end();
  }
}

async function ensureResetTable(pool: InstanceType<typeof Pool>) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      email      TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ
    )
  `);
}

/**
 * Generates a 1-hour password reset token for an email user.
 * Returns { token } on success or { error } if email not registered.
 * Note: the API layer intentionally returns a generic message to prevent
 * email enumeration — callers should NOT expose this error to the user.
 */
export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string } | { error: string }> {
  const pool = getPool();
  try {
    const normalized = email.trim().toLowerCase();
    await ensureResetTable(pool);

    const { rows } = await pool.query(
      `SELECT id FROM email_users WHERE email = $1`,
      [normalized],
    );
    if (!rows[0]) return { error: "Email not registered" };

    // Invalidate any existing tokens for this email
    await pool.query(`DELETE FROM password_reset_tokens WHERE email = $1`, [normalized]);

    const token = crypto.randomUUID().replace(/-/g, "");
    await pool.query(
      `INSERT INTO password_reset_tokens (token, user_id, email, expires_at)
       VALUES ($1,$2,$3, NOW() + INTERVAL '1 hour')`,
      [token, rows[0].id, normalized],
    );
    return { token };
  } finally {
    await pool.end();
  }
}

/** Validates a reset token and updates the user's password. */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  const pool = getPool();
  try {
    if (newPassword.length < 8) return { error: "Password must be at least 8 characters" };
    await ensureResetTable(pool);

    const { rows } = await pool.query(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens WHERE token = $1`,
      [token],
    );
    if (!rows[0]) return { error: "Invalid or expired reset link" };
    if (rows[0].used_at) return { error: "This reset link has already been used" };
    if (new Date(rows[0].expires_at as string) < new Date())
      return { error: "This reset link has expired" };

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE email_users SET password_hash=$1 WHERE id=$2`, [
      hash,
      rows[0].user_id,
    ]);
    await pool.query(
      `UPDATE password_reset_tokens SET used_at=NOW() WHERE token=$1`,
      [token],
    );
    return { ok: true };
  } finally {
    await pool.end();
  }
}
