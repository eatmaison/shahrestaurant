import { privateMetadata } from "../lib/privateMetadata";
import { AdminShell } from "./AdminShell";
export const metadata = privateMetadata("Beheer", "/admin");
export default function Layout({ children }: { children: React.ReactNode }) { return <AdminShell>{children}</AdminShell>; }
