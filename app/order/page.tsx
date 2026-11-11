import OrderExperience from "./OrderExperience";
import { loadPublicCatalog } from "../lib/publicCatalog.server";
import type { MenuSearchParams } from "../lib/menuSearch";

export default async function Page({ searchParams }: { searchParams: Promise<MenuSearchParams> }) {
  const [, initialCatalog] = await Promise.all([searchParams, loadPublicCatalog()]);
  return <OrderExperience searchParams={searchParams} initialCatalog={initialCatalog} />;
}
