import { publicMetadata } from "../lib/seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
import PageContent from "../order/page";
export const metadata = publicMetadata("menu", "nl");
export default function Page() { return <><Breadcrumbs page="menu" locale="nl" /><PageContent /></>; }
