import { unstable_cache } from "next/cache";
import * as repo from "./repo";
import { DEFAULT_SETTINGS, getSettings as readSettings } from "./settings";

/**
 * Cached storefront reads. The shop pages read settings, categories, products and reviews on every
 * visit; caching them means most pages need no database round trip at all.
 * Every database write clears the cache straight away (see `run`/`batch` in db.ts), so admin edits
 * and new orders still show on the very next page load. The hourly expiry is only a safety net.
 */
export const STORE_TAG = "store";
const opts = { tags: [STORE_TAG], revalidate: 3600 };
// Each deployment starts with a fresh cache (its one-time database updates may change settings).
const V = process.env.VERCEL_DEPLOYMENT_ID ?? "local";

const cachedSettings = unstable_cache(readSettings, ["settings", V], opts);
/** Defaults fill any setting a cached copy predates (a new setting must never crash a page). */
export const getSettings = async () => ({ ...DEFAULT_SETTINGS, ...(await cachedSettings()) });
export const categoryTree = unstable_cache(repo.categoryTree, ["categoryTree", V], opts);
export const listProducts = unstable_cache(repo.listProducts, ["listProducts", V], opts);
export const listReviews = unstable_cache(repo.listReviews, ["listReviews", V], opts);
export const getProductBySlug = unstable_cache(repo.getProductBySlug, ["getProductBySlug", V], opts);
