export type AdminDataView = "operations" | "stats" | "customers" | "events" | "products";
export function adminBootstrapView(path: string): AdminDataView | undefined {
  if (path === "/terminal") return "operations";
  return path === "/admin" || path.startsWith("/admin/") ? adminDataView(path) : undefined;
}
export function adminDataView(path: string): AdminDataView {
  if (path === "/admin/stats") return "stats";
  if (path === "/admin/customers") return "customers";
  if (path === "/admin/events") return "events";
  if (path === "/admin/products") return "products";
  return "operations";
}
export function parseAdminDataView(value: string | null | undefined): AdminDataView {
  return value === "stats" || value === "customers" || value === "events" || value === "products" ? value : "operations";
}
