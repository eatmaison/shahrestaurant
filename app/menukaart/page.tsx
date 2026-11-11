import { publicMetadata } from "../lib/seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
import OrderExperience from "../order/OrderExperience";
import { loadPublicCatalog } from "../lib/publicCatalog.server";
import type { MenuSearchParams } from "../lib/menuSearch";
export const metadata = publicMetadata("menu", "nl");
export default async function Page({ searchParams }: { searchParams: Promise<MenuSearchParams> }) {
  const [, initialCatalog] = await Promise.all([searchParams, loadPublicCatalog()]);
  return <><Breadcrumbs page="menu" locale="nl" /><OrderExperience searchParams={searchParams} initialCatalog={initialCatalog} /></>;
}
