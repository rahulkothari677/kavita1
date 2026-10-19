import type { InValue } from "@libsql/client";
import { query, queryOne, run, newId, nowIso, type Row } from "./db";
import type { Category, Coupon, CustomRequest, Order, OrderItem, Product, Review } from "./types";
import { slugify } from "./format";

const json = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== "string") return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};
const bool = (v: unknown) => v === 1 || v === "1" || v === true || v === 1n;
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

// ─── Categories ──────────────────────────────────────────────────────────────

function toCategory(r: Row): Category {
  return {
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    parentId: str(r.parentId),
    description: str(r.description),
    image: str(r.image),
    sortOrder: num(r.sortOrder),
    isActive: bool(r.isActive),
    productCount: r.productCount !== undefined ? num(r.productCount) : undefined,
  };
}

export async function listCategories(opts: { activeOnly?: boolean } = {}) {
  const rows = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM Product p WHERE p.isActive = 1 AND (p.categoryId = c.id OR p.categoryId IN (SELECT id FROM Category s WHERE s.parentId = c.id))) AS productCount
     FROM Category c ${opts.activeOnly ? "WHERE c.isActive = 1" : ""} ORDER BY c.sortOrder, c.name`,
  );
  return rows.map(toCategory);
}

/** Top-level categories with their sub-categories nested under `children`. */
export async function categoryTree(opts: { activeOnly?: boolean } = {}) {
  const all = await listCategories(opts);
  const ids = new Set(all.map((c) => c.id));
  const top = all.filter((c) => !c.parentId || !ids.has(c.parentId));
  return top.map((t) => ({ ...t, children: all.filter((c) => c.parentId === t.id) }));
}

export async function getCategoryBySlug(slug: string) {
  const r = await queryOne("SELECT * FROM Category WHERE slug = ?", [slug]);
  return r ? toCategory(r) : null;
}

export async function upsertCategory(data: Partial<Category> & { name: string }) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (data.id) {
    if (data.parentId === data.id) data.parentId = null;
    await run(`UPDATE Category SET name=?, slug=?, parentId=?, description=?, image=?, sortOrder=?, isActive=? WHERE id=?`, [
      data.name,
      await uniqueSlug("Category", slug, data.id),
      data.parentId ?? null,
      data.description ?? null,
      data.image ?? null,
      data.sortOrder ?? 0,
      data.isActive === false ? 0 : 1,
      data.id,
    ]);
    return data.id;
  }
  const id = newId("cat_");
  const max = await queryOne<{ m: number }>("SELECT COALESCE(MAX(sortOrder), 0) + 1 AS m FROM Category");
  await run(
    `INSERT INTO Category (id, name, slug, parentId, description, image, sortOrder, isActive, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, data.name, await uniqueSlug("Category", slug), data.parentId ?? null, data.description ?? null, data.image ?? null, num(max?.m), data.isActive === false ? 0 : 1, nowIso()],
  );
  return id;
}

export async function deleteCategory(id: string) {
  const cat = await queryOne<{ parentId: string | null }>("SELECT parentId FROM Category WHERE id = ?", [id]);
  // Products move up to the parent category (if any); sub-categories become top-level.
  await run("UPDATE Product SET categoryId = ? WHERE categoryId = ?", [cat?.parentId ?? null, id]);
  await run("UPDATE Category SET parentId = NULL WHERE parentId = ?", [id]);
  await run("DELETE FROM Category WHERE id = ?", [id]);
}

async function uniqueSlug(table: "Product" | "Category", base: string, excludeId?: string) {
  let slug = base || "item";
  let i = 1;
  while (true) {
    const existing = await queryOne<{ id: string }>(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
    if (!existing || existing.id === excludeId) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

function toProduct(r: Row): Product {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    categoryId: str(r.categoryId),
    categoryName: str(r.categoryName),
    categorySlug: str(r.categorySlug),
    price: num(r.price),
    compareAtPrice: numOrNull(r.compareAtPrice),
    images: json<string[]>(r.images, []),
    shortDescription: String(r.shortDescription ?? ""),
    description: String(r.description ?? ""),
    size: str(r.size),
    materials: json<string[]>(r.materials, []),
    colors: json<string[]>(r.colors, []),
    tags: json<string[]>(r.tags, []),
    care: str(r.care),
    stock: num(r.stock),
    madeToOrder: bool(r.madeToOrder),
    leadTimeDays: numOrNull(r.leadTimeDays),
    customizable: bool(r.customizable),
    isActive: bool(r.isActive),
    isFeatured: bool(r.isFeatured),
    isBestseller: bool(r.isBestseller),
    isDemo: bool(r.isDemo),
    badge: str(r.badge),
    seoTitle: str(r.seoTitle),
    seoDescription: str(r.seoDescription),
    views: num(r.views),
    whatsappClicks: num(r.whatsappClicks),
    sortOrder: num(r.sortOrder),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
    rating: r.rating !== undefined && r.rating !== null ? Number(r.rating) : undefined,
    reviewCount: r.reviewCount !== undefined ? num(r.reviewCount) : undefined,
  };
}

const PRODUCT_SELECT = `SELECT p.*, c.name AS categoryName, c.slug AS categorySlug,
  (SELECT AVG(rating) FROM Review r WHERE r.productId = p.id AND r.isApproved = 1) AS rating,
  (SELECT COUNT(*) FROM Review r WHERE r.productId = p.id AND r.isApproved = 1) AS reviewCount
  FROM Product p LEFT JOIN Category c ON c.id = p.categoryId`;

export type ProductFilter = {
  activeOnly?: boolean;
  category?: string; // slug
  search?: string;
  featured?: boolean;
  bestseller?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "popular";
  limit?: number;
  excludeId?: string;
};

export async function listProducts(f: ProductFilter = {}) {
  const where: string[] = [];
  const args: InValue[] = [];
  if (f.activeOnly) where.push("p.isActive = 1");
  if (f.category) {
    // Matches the category itself or any of its sub-categories
    where.push("(c.slug = ? OR c.parentId = (SELECT id FROM Category WHERE slug = ?))");
    args.push(f.category, f.category);
  }
  if (f.featured) where.push("p.isFeatured = 1");
  if (f.bestseller) where.push("p.isBestseller = 1");
  if (f.inStockOnly) where.push("(p.stock > 0 OR p.madeToOrder = 1)");
  if (f.minPrice !== undefined) {
    where.push("p.price >= ?");
    args.push(f.minPrice);
  }
  if (f.maxPrice !== undefined) {
    where.push("p.price <= ?");
    args.push(f.maxPrice);
  }
  if (f.excludeId) {
    where.push("p.id != ?");
    args.push(f.excludeId);
  }
  if (f.search) {
    const terms = f.search.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const t of terms) {
      where.push(
        "(LOWER(p.name) LIKE ? OR LOWER(p.shortDescription) LIKE ? OR LOWER(p.tags) LIKE ? OR LOWER(p.colors) LIKE ? OR LOWER(COALESCE(c.name,'')) LIKE ?)",
      );
      const like = `%${t}%`;
      args.push(like, like, like, like, like);
    }
  }
  const order = {
    featured: "p.isFeatured DESC, p.isBestseller DESC, p.sortOrder ASC, p.createdAt DESC",
    newest: "p.createdAt DESC",
    "price-asc": "p.price ASC",
    "price-desc": "p.price DESC",
    popular: "p.isBestseller DESC, (p.views + p.whatsappClicks * 5) DESC",
  }[f.sort ?? "featured"];
  const sql = `${PRODUCT_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} ${f.limit ? `LIMIT ${Math.floor(f.limit)}` : ""}`;
  const rows = await query(sql, args);
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string) {
  const r = await queryOne(`${PRODUCT_SELECT} WHERE p.slug = ?`, [slug]);
  return r ? toProduct(r) : null;
}

export async function getProductById(id: string) {
  const r = await queryOne(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
  return r ? toProduct(r) : null;
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await query(`${PRODUCT_SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")})`, ids);
  return rows.map(toProduct);
}

export type ProductInput = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">> & { name: string };

export async function saveProduct(input: ProductInput, id?: string) {
  const now = nowIso();
  const slug = await uniqueSlug("Product", slugify(input.slug || input.name), id);
  const fields: Record<string, InValue> = {
    slug,
    name: input.name.trim(),
    categoryId: input.categoryId || null,
    price: Math.max(0, Math.round(Number(input.price ?? 0))),
    compareAtPrice: input.compareAtPrice ? Math.round(Number(input.compareAtPrice)) : null,
    images: JSON.stringify(input.images ?? []),
    shortDescription: input.shortDescription ?? "",
    description: input.description ?? "",
    size: input.size || null,
    materials: JSON.stringify(input.materials ?? []),
    colors: JSON.stringify(input.colors ?? []),
    tags: JSON.stringify(input.tags ?? []),
    care: input.care || null,
    stock: Math.max(0, Math.round(Number(input.stock ?? 1))),
    madeToOrder: input.madeToOrder ? 1 : 0,
    leadTimeDays: input.leadTimeDays ? Number(input.leadTimeDays) : null,
    customizable: input.customizable ? 1 : 0,
    isActive: input.isActive === false ? 0 : 1,
    isFeatured: input.isFeatured ? 1 : 0,
    isBestseller: input.isBestseller ? 1 : 0,
    badge: input.badge || null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    updatedAt: now,
  };
  if (id) {
    const keys = Object.keys(fields);
    await run(`UPDATE Product SET ${keys.map((k) => `${k} = ?`).join(", ")}, isDemo = 0 WHERE id = ?`, [
      ...keys.map((k) => fields[k]),
      id,
    ]);
    return { id, slug };
  }
  const newProductId = newId("p_");
  const all = { id: newProductId, ...fields, sortOrder: 0, createdAt: now };
  const keys = Object.keys(all) as (keyof typeof all)[];
  await run(`INSERT INTO Product (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`, keys.map((k) => all[k]));
  return { id: newProductId, slug };
}

const PATCHABLE = new Set(["isActive", "isFeatured", "isBestseller", "stock", "price", "badge", "sortOrder", "categoryId", "compareAtPrice"]);

export async function patchProduct(id: string, patch: Record<string, unknown>) {
  const keys = Object.keys(patch).filter((k) => PATCHABLE.has(k));
  if (!keys.length) return;
  const vals = keys.map((k) => {
    const v = patch[k];
    if (typeof v === "boolean") return v ? 1 : 0;
    return (v ?? null) as InValue;
  });
  await run(`UPDATE Product SET ${keys.map((k) => `${k} = ?`).join(", ")}, updatedAt = ? WHERE id = ?`, [...vals, nowIso(), id]);
}

export async function deleteProduct(id: string) {
  await run("DELETE FROM Review WHERE productId = ?", [id]);
  await run("DELETE FROM Product WHERE id = ?", [id]);
}

export async function duplicateProduct(id: string) {
  const p = await getProductById(id);
  if (!p) return null;
  return saveProduct({ ...p, name: `${p.name} (copy)`, slug: undefined, isActive: false });
}

export async function bumpProductCounter(id: string, field: "views" | "whatsappClicks") {
  await run(`UPDATE Product SET ${field} = ${field} + 1 WHERE id = ?`, [id]);
}

export async function deleteDemoProducts() {
  await run("DELETE FROM Product WHERE isDemo = 1");
}

// ─── Orders ──────────────────────────────────────────────────────────────────

function toOrder(r: Row): Order {
  return {
    id: String(r.id),
    orderNumber: String(r.orderNumber),
    customerName: String(r.customerName),
    phone: String(r.phone),
    email: str(r.email),
    address: str(r.address),
    city: str(r.city),
    state: str(r.state),
    pincode: str(r.pincode),
    notes: str(r.notes),
    items: json<OrderItem[]>(r.items, []),
    subtotal: num(r.subtotal),
    shipping: num(r.shipping),
    discount: num(r.discount),
    couponCode: str(r.couponCode),
    total: num(r.total),
    status: String(r.status) as Order["status"],
    paymentStatus: String(r.paymentStatus) as Order["paymentStatus"],
    paymentMethod: str(r.paymentMethod),
    courier: str(r.courier),
    trackingNumber: str(r.trackingNumber),
    source: String(r.source ?? "website"),
    adminNotes: str(r.adminNotes),
    history: json(r.history, []),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export function makeOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KA-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createOrder(o: Omit<Order, "id" | "createdAt" | "updatedAt" | "history" | "orderNumber"> & { orderNumber?: string }) {
  const id = newId("o_");
  const now = nowIso();
  const orderNumber = o.orderNumber || makeOrderNumber();
  await run(
    `INSERT INTO "Order" (id, orderNumber, customerName, phone, email, address, city, state, pincode, notes, items, subtotal, shipping, discount, couponCode, total, status, paymentStatus, paymentMethod, courier, trackingNumber, source, adminNotes, history, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      orderNumber,
      o.customerName,
      o.phone,
      o.email,
      o.address,
      o.city,
      o.state,
      o.pincode,
      o.notes,
      JSON.stringify(o.items),
      o.subtotal,
      o.shipping,
      o.discount,
      o.couponCode,
      o.total,
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.courier,
      o.trackingNumber,
      o.source,
      o.adminNotes,
      JSON.stringify([{ status: o.status, at: now, note: o.source === "website" ? "Order placed on website" : "Order added by admin" }]),
      now,
      now,
    ],
  );
  if (o.couponCode) await run("UPDATE Coupon SET usageCount = usageCount + 1 WHERE code = ?", [o.couponCode]);
  if (!["PENDING", "CANCELLED"].includes(o.status)) await adjustStock(o.items, -1);
  return { id, orderNumber };
}

export async function listOrders(f: { status?: string; search?: string; limit?: number } = {}) {
  const where: string[] = [];
  const args: InValue[] = [];
  if (f.status && f.status !== "ALL") {
    where.push("status = ?");
    args.push(f.status);
  }
  if (f.search) {
    where.push("(LOWER(customerName) LIKE ? OR phone LIKE ? OR LOWER(orderNumber) LIKE ? OR LOWER(COALESCE(city,'')) LIKE ?)");
    const like = `%${f.search.toLowerCase()}%`;
    args.push(like, like, like, like);
  }
  const rows = await query(
    `SELECT * FROM "Order" ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY createdAt DESC ${f.limit ? `LIMIT ${Math.floor(f.limit)}` : ""}`,
    args,
  );
  return rows.map(toOrder);
}

export async function getOrder(idOrNumber: string) {
  const r = await queryOne(`SELECT * FROM "Order" WHERE id = ? OR orderNumber = ?`, [idOrNumber, idOrNumber]);
  return r ? toOrder(r) : null;
}

const ORDER_EDITABLE = [
  "customerName",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "notes",
  "status",
  "paymentStatus",
  "paymentMethod",
  "courier",
  "trackingNumber",
  "adminNotes",
  "shipping",
  "discount",
  "items",
] as const;

export async function updateOrder(id: string, patch: Partial<Order> & { historyNote?: string }) {
  const existing = await getOrder(id);
  if (!existing) return null;
  const sets: string[] = [];
  const args: InValue[] = [];
  for (const k of ORDER_EDITABLE) {
    if (patch[k] === undefined) continue;
    sets.push(`${k} = ?`);
    args.push(k === "items" ? JSON.stringify(patch.items) : ((patch[k] as InValue) ?? null));
  }
  // Recalculate totals if money fields/items changed
  if (patch.items || patch.shipping !== undefined || patch.discount !== undefined) {
    const items = patch.items ?? existing.items;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = patch.shipping ?? existing.shipping;
    const discount = patch.discount ?? existing.discount;
    sets.push("subtotal = ?", "total = ?");
    args.push(subtotal, Math.max(0, subtotal + shipping - discount));
  }
  const history = [...existing.history];
  if (patch.status && patch.status !== existing.status) {
    history.push({ status: patch.status, at: nowIso(), note: patch.historyNote });
    // Stock: reduce when confirmed, restore when cancelled after confirmation
    const wasCommitted = !["PENDING", "CANCELLED"].includes(existing.status);
    const isCommitted = !["PENDING", "CANCELLED"].includes(patch.status);
    if (!wasCommitted && isCommitted) await adjustStock(existing.items, -1);
    if (wasCommitted && patch.status === "CANCELLED") await adjustStock(existing.items, 1);
  }
  sets.push("history = ?", "updatedAt = ?");
  args.push(JSON.stringify(history), nowIso());
  await run(`UPDATE "Order" SET ${sets.join(", ")} WHERE id = ?`, [...args, existing.id]);
  return getOrder(existing.id);
}

async function adjustStock(items: OrderItem[], dir: 1 | -1) {
  for (const it of items) {
    if (!it.productId) continue;
    await run(`UPDATE Product SET stock = MAX(0, stock + ?) WHERE id = ? AND madeToOrder = 0`, [dir * it.quantity, it.productId]);
  }
}

export async function deleteOrder(id: string) {
  await run(`DELETE FROM "Order" WHERE id = ?`, [id]);
}

export async function findOrdersForTracking(orderNumber: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const rows = await query(`SELECT * FROM "Order" WHERE UPPER(orderNumber) = ?`, [orderNumber.trim().toUpperCase()]);
  return rows.map(toOrder).filter((o) => o.phone.replace(/\D/g, "").slice(-10) === digits);
}

// ─── Custom requests ─────────────────────────────────────────────────────────

function toRequest(r: Row): CustomRequest {
  return {
    id: String(r.id),
    name: String(r.name),
    phone: String(r.phone),
    email: str(r.email),
    type: str(r.type),
    description: String(r.description),
    size: str(r.size),
    colors: str(r.colors),
    budget: str(r.budget),
    deadline: str(r.deadline),
    aiConcept: str(r.aiConcept),
    status: String(r.status),
    quotedPrice: numOrNull(r.quotedPrice),
    adminNotes: str(r.adminNotes),
    createdAt: String(r.createdAt),
  };
}

export async function createCustomRequest(d: Omit<CustomRequest, "id" | "createdAt" | "status" | "quotedPrice" | "adminNotes">) {
  const id = newId("cr_");
  await run(
    `INSERT INTO CustomRequest (id, name, phone, email, type, description, size, colors, budget, deadline, aiConcept, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,'NEW',?)`,
    [id, d.name, d.phone, d.email, d.type, d.description, d.size, d.colors, d.budget, d.deadline, d.aiConcept, nowIso()],
  );
  return id;
}

export async function listCustomRequests() {
  return (await query("SELECT * FROM CustomRequest ORDER BY createdAt DESC")).map(toRequest);
}

export async function updateCustomRequest(id: string, patch: Partial<CustomRequest>) {
  await run(`UPDATE CustomRequest SET status = COALESCE(?, status), quotedPrice = ?, adminNotes = ? WHERE id = ?`, [
    patch.status ?? null,
    patch.quotedPrice ?? null,
    patch.adminNotes ?? null,
    id,
  ]);
}

export async function deleteCustomRequest(id: string) {
  await run("DELETE FROM CustomRequest WHERE id = ?", [id]);
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

function toReview(r: Row): Review {
  return {
    id: String(r.id),
    productId: str(r.productId),
    productName: str(r.productName),
    name: String(r.name),
    city: str(r.city),
    rating: num(r.rating),
    comment: String(r.comment),
    isApproved: bool(r.isApproved),
    isFeatured: bool(r.isFeatured),
    createdAt: String(r.createdAt),
  };
}

export async function listReviews(f: { productId?: string; approvedOnly?: boolean; featuredOnly?: boolean; limit?: number } = {}) {
  const where: string[] = [];
  const args: InValue[] = [];
  if (f.productId) {
    where.push("r.productId = ?");
    args.push(f.productId);
  }
  if (f.approvedOnly) where.push("r.isApproved = 1");
  if (f.featuredOnly) where.push("r.isFeatured = 1");
  const rows = await query(
    `SELECT r.*, p.name AS productName FROM Review r LEFT JOIN Product p ON p.id = r.productId ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY r.createdAt DESC ${f.limit ? `LIMIT ${Math.floor(f.limit)}` : ""}`,
    args,
  );
  return rows.map(toReview);
}

export async function createReview(d: { productId: string | null; name: string; city?: string | null; rating: number; comment: string; isApproved?: boolean; isFeatured?: boolean }) {
  const id = newId("r_");
  await run(`INSERT INTO Review (id, productId, name, city, rating, comment, isApproved, isFeatured, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`, [
    id,
    d.productId,
    d.name,
    d.city ?? null,
    Math.min(5, Math.max(1, Math.round(d.rating))),
    d.comment,
    d.isApproved ? 1 : 0,
    d.isFeatured ? 1 : 0,
    nowIso(),
  ]);
  return id;
}

export async function updateReview(id: string, patch: { isApproved?: boolean; isFeatured?: boolean }) {
  if (patch.isApproved !== undefined) await run("UPDATE Review SET isApproved = ? WHERE id = ?", [patch.isApproved ? 1 : 0, id]);
  if (patch.isFeatured !== undefined) await run("UPDATE Review SET isFeatured = ? WHERE id = ?", [patch.isFeatured ? 1 : 0, id]);
}

export async function deleteReview(id: string) {
  await run("DELETE FROM Review WHERE id = ?", [id]);
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

function toCoupon(r: Row): Coupon {
  return {
    id: String(r.id),
    code: String(r.code),
    type: String(r.type) as Coupon["type"],
    value: num(r.value),
    minOrder: num(r.minOrder),
    isActive: bool(r.isActive),
    expiresAt: str(r.expiresAt),
    usageCount: num(r.usageCount),
    createdAt: String(r.createdAt),
  };
}

export async function listCoupons() {
  return (await query("SELECT * FROM Coupon ORDER BY createdAt DESC")).map(toCoupon);
}

export async function saveCoupon(c: Partial<Coupon> & { code: string; value: number }) {
  const code = c.code.trim().toUpperCase().replace(/\s+/g, "");
  if (c.id) {
    await run("UPDATE Coupon SET code=?, type=?, value=?, minOrder=?, isActive=?, expiresAt=? WHERE id=?", [
      code,
      c.type ?? "PERCENT",
      c.value,
      c.minOrder ?? 0,
      c.isActive === false ? 0 : 1,
      c.expiresAt || null,
      c.id,
    ]);
    return c.id;
  }
  const id = newId("cp_");
  await run("INSERT INTO Coupon (id, code, type, value, minOrder, isActive, expiresAt, usageCount, createdAt) VALUES (?,?,?,?,?,?,?,0,?)", [
    id,
    code,
    c.type ?? "PERCENT",
    c.value,
    c.minOrder ?? 0,
    c.isActive === false ? 0 : 1,
    c.expiresAt || null,
    nowIso(),
  ]);
  return id;
}

export async function deleteCoupon(id: string) {
  await run("DELETE FROM Coupon WHERE id = ?", [id]);
}

/** Returns discount in rupees, or an error message. */
export async function evaluateCoupon(code: string, subtotal: number): Promise<{ discount: number; code: string } | { error: string }> {
  const r = await queryOne("SELECT * FROM Coupon WHERE code = ?", [code.trim().toUpperCase()]);
  if (!r) return { error: "This code doesn't exist" };
  const c = toCoupon(r);
  if (!c.isActive) return { error: "This code is no longer active" };
  const expiry = c.expiresAt && (c.expiresAt.length === 10 ? `${c.expiresAt}T23:59:59+05:30` : c.expiresAt);
  if (expiry && new Date(expiry).getTime() < Date.now()) return { error: "This code has expired" };
  if (subtotal < c.minOrder) return { error: `Add items worth ₹${c.minOrder - subtotal} more to use this code` };
  const discount = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { discount, code: c.code };
}

// ─── Subscribers ─────────────────────────────────────────────────────────────

export async function addSubscriber(contact: string) {
  await run("INSERT OR IGNORE INTO Subscriber (id, contact, createdAt) VALUES (?,?,?)", [newId("s_"), contact.trim(), nowIso()]);
}

export async function listSubscribers() {
  return query<{ id: string; contact: string; createdAt: string }>("SELECT * FROM Subscriber ORDER BY createdAt DESC");
}
