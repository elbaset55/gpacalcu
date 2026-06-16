import bcrypt from "bcryptjs";
import { query } from "@/integrations/replit/db";

export async function registerEmailUser(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ userId: string } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return { error: "Invalid email address" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const { rows: existing } = await query(
    `SELECT id FROM email_users WHERE email = $1`,
    [normalized],
  );
  if (existing.length > 0) return { error: "Email already registered" };

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `eu_${crypto.randomUUID().replace(/-/g, "")}`;

  await query(
    `INSERT INTO email_users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)`,
    [userId, normalized, passwordHash, displayName ?? null],
  );
  const name = displayName ?? normalized.split("@")[0];
  await query(
    `INSERT INTO replit_users (id, email, first_name, updated_at)
     VALUES ($1,$2,$3,NOW()) ON CONFLICT (id) DO NOTHING`,
    [userId, normalized, name],
  );
  return { userId };
}

export async function loginEmailUser(
  email: string,
  password: string,
): Promise<{ userId: string } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  const { rows } = await query(
    `SELECT id, password_hash FROM email_users WHERE email = $1`,
    [normalized],
  );
  if (!rows[0]) return { error: "Invalid email or password" };
  const r = rows[0] as { id: string; password_hash: string };
  const valid = await bcrypt.compare(password, r.password_hash);
  if (!valid) return { error: "Invalid email or password" };
  return { userId: r.id };
}

export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string } | { error: string }> {
  const normalized = email.trim().toLowerCase();

  const { rows } = await query(
    `SELECT id FROM email_users WHERE email = $1`,
    [normalized],
  );
  if (!rows[0]) return { error: "Email not registered" };

  await query(`DELETE FROM password_reset_tokens WHERE email = $1`, [normalized]);

  const token = crypto.randomUUID().replace(/-/g, "");
  await query(
    `INSERT INTO password_reset_tokens (token, user_id, email, expires_at)
     VALUES ($1,$2,$3, NOW() + INTERVAL '1 hour')`,
    [token, (rows[0] as { id: string }).id, normalized],
  );
  return { token };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters" };

  const { rows } = await query(
    `SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1`,
    [token],
  );
  if (!rows[0]) return { error: "Invalid or expired reset link" };
  const r = rows[0] as { user_id: string; expires_at: string; used_at: string | null };
  if (r.used_at) return { error: "This reset link has already been used" };
  if (new Date(r.expires_at) < new Date()) return { error: "This reset link has expired" };

  const hash = await bcrypt.hash(newPassword, 12);
  await query(`UPDATE email_users SET password_hash=$1 WHERE id=$2`, [hash, r.user_id]);
  await query(`UPDATE password_reset_tokens SET used_at=NOW() WHERE token=$1`, [token]);
  return { ok: true };
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters" };

  const { rows } = await query(
    `SELECT password_hash FROM email_users WHERE id = $1`,
    [userId],
  );
  if (!rows[0]) return { error: "Account not found or not an email account" };
  const r = rows[0] as { password_hash: string };
  const valid = await bcrypt.compare(oldPassword, r.password_hash);
  if (!valid) return { error: "Current password is incorrect" };

  const hash = await bcrypt.hash(newPassword, 12);
  await query(`UPDATE email_users SET password_hash=$1 WHERE id=$2`, [hash, userId]);
  return { ok: true };
}
