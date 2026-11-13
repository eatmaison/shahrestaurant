export type AdminDataView = "operations" | "stats" | "customers" | "events";
export function adminDataView(path: string): AdminDataView {
  if (path === "/admin/stats") return "stats";
  if (path === "/admin/customers") return "customers";
  if (path === "/admin/events") return "events";
  return "operations";
}
export function parseAdminDataView(value: string | null | undefined): AdminDataView {
  return value === "stats" || value === "customers" || value === "events" ? value : "operations";
}
