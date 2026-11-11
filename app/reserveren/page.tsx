import { publicMetadata } from "../lib/seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
import PageContent from "../reservations/page";
export const metadata = publicMetadata("reservations", "nl");
export default function Page() { return <><Breadcrumbs page="reservations" locale="nl" /><PageContent /></>; }
