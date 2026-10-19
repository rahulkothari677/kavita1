import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { getPrivate, setPrivate } from "./settings";

const COOKIE = "ka_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function secretKey() {
  // Stable across all server instances: explicit secret, else derived from the database token.
  const dbToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  let s = process.env.AUTH_SECRET || (dbToken ? createHash("sha256").update(`kavitas-admin:${dbToken}`).digest("hex") : undefined);
  if (!s) {
    s = (await getPrivate("authSecret")) ?? undefined;
    if (!s) {
      s = randomBytes(32).toString("hex");
      await setPrivate("authSecret", s);
    }
  }
  return new TextEncoder().encode(s);
}

/** Admin password is set either by ADMIN_PASSWORD env var or created in the first-run setup screen. */
export async function hasAdminPassword() {
  return Boolean(process.env.ADMIN_PASSWORD) || Boolean(await getPrivate("adminPasswordHash"));
}

export async function verifyPassword(password: string) {
  const hash = await getPrivate("adminPasswordHash");
  if (hash) return bcrypt.compare(password, hash);
  if (process.env.ADMIN_PASSWORD) return password === process.env.ADMIN_PASSWORD;
  return false;
}

export async function setAdminPassword(password: string) {
  await setPrivate("adminPasswordHash", await bcrypt.hash(password, 10));
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(await secretKey());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, await secretKey());
    return true;
  } catch {
    return false;
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, "Please log in again");
}
