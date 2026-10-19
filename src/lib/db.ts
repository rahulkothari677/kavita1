import { createClient, type Client, type InValue } from "@libsql/client";
import { SEED_CATEGORIES, SEED_CATEGORIES_V2, seedCategoryStatements, seedDemoProducts, seedDemoProductsV2 } from "./seed";

/**
 * Database: libSQL / SQLite.
 *  - Production (Vercel): set DATABASE_URL=libsql://...turso.io and DATABASE_AUTH_TOKEN.
 *  - Local dev: falls back to a file database at ./data/local.db
 */

let client: Client | null = null;
let ready: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;
  // On Vercel without a database configured, fall back to /tmp (temporary!) so the site still boots;
  // the admin Settings page shows a clear warning until Turso is connected.
  const fallback = process.env.VERCEL === "1" ? "file:/tmp/kavitas.db" : "file:./data/local.db";
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || fallback;
  if (url === "file:./data/local.db") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    try {
      fs.mkdirSync("./data", { recursive: true });
    } catch {}
  }
  client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS Setting (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Category (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parentId TEXT,
    description TEXT,
    image TEXT,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Product (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    categoryId TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    compareAtPrice INTEGER,
    images TEXT NOT NULL DEFAULT '[]',
    shortDescription TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    size TEXT,
    materials TEXT NOT NULL DEFAULT '[]',
    colors TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    care TEXT,
    stock INTEGER NOT NULL DEFAULT 1,
    madeToOrder INTEGER NOT NULL DEFAULT 0,
    leadTimeDays INTEGER,
    customizable INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    isFeatured INTEGER NOT NULL DEFAULT 0,
    isBestseller INTEGER NOT NULL DEFAULT 0,
    isDemo INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    seoTitle TEXT,
    seoDescription TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    whatsappClicks INTEGER NOT NULL DEFAULT 0,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_category ON Product(categoryId)`,
  `CREATE TABLE IF NOT EXISTS "Order" (
    id TEXT PRIMARY KEY,
    orderNumber TEXT NOT NULL UNIQUE,
    customerName TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    notes TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    subtotal INTEGER NOT NULL DEFAULT 0,
    shipping INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    couponCode TEXT,
    total INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    paymentStatus TEXT NOT NULL DEFAULT 'UNPAID',
    paymentMethod TEXT,
    courier TEXT,
    trackingNumber TEXT,
    source TEXT NOT NULL DEFAULT 'website',
    adminNotes TEXT,
    history TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_order_phone ON "Order"(phone)`,
  `CREATE TABLE IF NOT EXISTS CustomRequest (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    type TEXT,
    description TEXT NOT NULL,
    size TEXT,
    colors TEXT,
    budget TEXT,
    deadline TEXT,
    aiConcept TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    quotedPrice INTEGER,
    adminNotes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Review (
    id TEXT PRIMARY KEY,
    productId TEXT,
    name TEXT NOT NULL,
    city TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    comment TEXT NOT NULL,
    isApproved INTEGER NOT NULL DEFAULT 0,
    isFeatured INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Coupon (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'PERCENT',
    value INTEGER NOT NULL,
    minOrder INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    expiresAt TEXT,
    usageCount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Subscriber (
    id TEXT PRIMARY KEY,
    contact TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ImageBlob (
    id TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`,
];

async function init() {
  const c = getClient();
  await c.batch(SCHEMA.map((sql) => ({ sql, args: [] })), "write");
  const seeded = await c.execute({ sql: "SELECT value FROM Setting WHERE key = 'seeded'", args: [] });
  if (seeded.rows.length === 0) {
    const now = new Date().toISOString();
    const stmts = SEED_CATEGORIES.map((cat, i) => ({
      sql: `INSERT OR IGNORE INTO Category (id, name, slug, parentId, description, image, sortOrder, isActive, createdAt) VALUES (?,?,?,?,?,?,?,1,?)`,
      args: [cat.id, cat.name, cat.slug, cat.parentId, cat.description, cat.image, i, now] as InValue[],
    }));
    stmts.push(...seedDemoProducts(now));
    stmts.push({ sql: `INSERT OR REPLACE INTO Setting (key, value) VALUES ('seeded', '"1"')`, args: [] });
    await c.batch(stmts, "write");
  }
  // Demo catalogue v2 (real photos). Added once — but only while the shop is still showing demo
  // products or has no products of its own, so it never re-appears after the owner removed demos.
  const v2 = await c.execute({ sql: "SELECT value FROM Setting WHERE key = 'demoV2'", args: [] });
  if (v2.rows.length === 0) {
    const counts = await c.execute({ sql: "SELECT SUM(isDemo = 1) AS demo, SUM(isDemo = 0) AS own FROM Product", args: [] });
    const demo = Number(counts.rows[0]?.demo ?? 0);
    const own = Number(counts.rows[0]?.own ?? 0);
    const now = new Date().toISOString();
    const stmts: { sql: string; args: InValue[] }[] = [];
    if (demo > 0 || own === 0) stmts.push(...seedCategoryStatements(SEED_CATEGORIES_V2, now, 20), ...seedDemoProductsV2(now));
    stmts.push({ sql: `INSERT OR REPLACE INTO Setting (key, value) VALUES ('demoV2', '"1"')`, args: [] });
    await c.batch(stmts, "write");
  }
}

export async function ensureDb() {
  if (!ready) {
    ready = init().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ensureDb();
  const res = await getClient().execute({ sql, args });
  return res.rows.map((r) => ({ ...r }) as T);
}

export async function queryOne<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args: InValue[] = []) {
  await ensureDb();
  return getClient().execute({ sql, args });
}

export async function batch(stmts: { sql: string; args: InValue[] }[]) {
  await ensureDb();
  return getClient().batch(stmts, "write");
}

export function newId(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function nowIso() {
  return new Date().toISOString();
}
