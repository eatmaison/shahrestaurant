import { publicMetadata } from "../../lib/seo";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import OrderExperience from "../../order/OrderExperience";
import { loadPublicCatalog } from "../../lib/publicCatalog.server";
import type { MenuSearchParams } from "../../lib/menuSearch";
export const metadata = publicMetadata("menu", "en");
export default async function Page({ searchParams }: { searchParams: Promise<MenuSearchParams> }) {
  const [, initialCatalog] = await Promise.all([searchParams, loadPublicCatalog()]);
  return <><Breadcrumbs page="menu" locale="en" /><OrderExperience searchParams={searchParams} initialCatalog={initialCatalog} /></>;
}
