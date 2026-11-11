import { publicMetadata } from "../../lib/seo";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import PageContent from "../../privacy/page";
export const metadata = publicMetadata("privacy", "en");
export default function Page() { return <><Breadcrumbs page="privacy" locale="en" /><PageContent /></>; }
