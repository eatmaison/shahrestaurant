import { publicMetadata } from "../lib/seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
import PageContent from "../terms/page";
export const metadata = publicMetadata("terms", "nl");
export default function Page() { return <><Breadcrumbs page="terms" locale="nl" /><PageContent /></>; }
