import { publicMetadata } from "../../lib/seo";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import PageContent from "../../order/page";
export const metadata = publicMetadata("menu", "en");
export default function Page() { return <><Breadcrumbs page="menu" locale="en" /><PageContent /></>; }
