import { publicMetadata } from "../lib/seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
export const metadata = publicMetadata("privacy", "nl");
export default function Layout({ children }: { children: React.ReactNode }) { return <><Breadcrumbs page="privacy" locale="nl" />{children}</>; }
