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
