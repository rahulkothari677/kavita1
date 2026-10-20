import { unstable_cache } from "next/cache";
import * as repo from "./repo";
import { getSettings as readSettings } from "./settings";

/**
 * Cached storefront reads. The shop pages read settings, categories, products and reviews on every
 * visit; caching them means most pages need no database round trip at all.
 * Every database write clears the cache straight away (see `run`/`batch` in db.ts), so admin edits
 * and new orders still show on the very next page load. The hourly expiry is only a safety net.
 */
export const STORE_TAG = "store";
const opts = { tags: [STORE_TAG], revalidate: 3600 };

export const getSettings = unstable_cache(readSettings, ["settings"], opts);
export const categoryTree = unstable_cache(repo.categoryTree, ["categoryTree"], opts);
export const listProducts = unstable_cache(repo.listProducts, ["listProducts"], opts);
export const listReviews = unstable_cache(repo.listReviews, ["listReviews"], opts);
export const getProductBySlug = unstable_cache(repo.getProductBySlug, ["getProductBySlug"], opts);
