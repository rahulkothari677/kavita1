// Copy every table and row from one Turso (libSQL) database to another — used to move the shop's
// database to a new region (e.g. USA → Mumbai). The source is only read, never changed.
//
//   FROM_URL=libsql://old.turso.io FROM_TOKEN=... TO_URL=libsql://new.turso.io TO_TOKEN=... node scripts/copy-db.mjs
//
// The target must be a brand-new, empty database. Afterwards the script compares row counts.
import { createClient } from "@libsql/client";

const { FROM_URL, FROM_TOKEN, TO_URL, TO_TOKEN } = process.env;
if (!FROM_URL || !TO_URL) {
  console.error("Set FROM_URL, FROM_TOKEN, TO_URL and TO_TOKEN (see docs/HANDOFF.md → Move to Mumbai).");
  process.exit(1);
}
if (FROM_URL === TO_URL) {
  console.error("FROM_URL and TO_URL are the same database.");
  process.exit(1);
}
const from = createClient({ url: FROM_URL, authToken: FROM_TOKEN });
const to = createClient({ url: TO_URL, authToken: TO_TOKEN });

const schema = (
  await from.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY type = 'index', name",
  )
).rows;
const tables = schema.filter((r) => r.type === "table").map((r) => String(r.name));

const existing = (await to.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")).rows.map((r) => String(r.name));
for (const t of existing) {
  const n = Number((await to.execute(`SELECT COUNT(*) AS n FROM "${t}"`)).rows[0].n);
  if (n > 0) {
    console.error(`The target database is not empty (table ${t} has ${n} rows). Use a brand-new database.`);
    process.exit(1);
  }
}

for (const r of schema) {
  const sql = String(r.sql).replace(/^CREATE (TABLE|INDEX|UNIQUE INDEX) /i, (m) => `${m}IF NOT EXISTS `);
  await to.execute(sql);
}
console.log(`Created ${tables.length} tables.`);

for (const t of tables) {
  const rows = (await from.execute(`SELECT * FROM "${t}"`)).rows;
  if (!rows.length) {
    console.log(`  ${t}: 0 rows`);
    continue;
  }
  const cols = Object.keys(rows[0]);
  const sql = `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
  const size = t === "ImageBlob" ? 5 : 100; // uploaded photos are large
  for (let i = 0; i < rows.length; i += size) {
    await to.batch(
      rows.slice(i, i + size).map((row) => ({ sql, args: cols.map((c) => row[c]) })),
      "write",
    );
  }
  console.log(`  ${t}: ${rows.length} rows`);
}

let ok = true;
for (const t of tables) {
  const a = Number((await from.execute(`SELECT COUNT(*) AS n FROM "${t}"`)).rows[0].n);
  const b = Number((await to.execute(`SELECT COUNT(*) AS n FROM "${t}"`)).rows[0].n);
  if (a !== b) {
    ok = false;
    console.error(`  MISMATCH ${t}: ${a} → ${b}`);
  }
}
console.log(ok ? "\nDone — every table copied and verified." : "\nSome tables did not match — do not switch yet.");
process.exit(ok ? 0 : 1);
