import type { BrandConfig, Product } from "./types";

/** Public database data only. No user, order, session or opening-status records. */
export interface PublicCatalogSnapshot {
  products: Product[];
  brands: BrandConfig[];
}
