import { publicMetadata } from "../../lib/seo";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import PageContent from "../../terms/page";
export const metadata = publicMetadata("terms", "en");
export default function Page() { return <><Breadcrumbs page="terms" locale="en" /><PageContent /></>; }
