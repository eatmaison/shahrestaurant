import { privateMetadata } from "../lib/privateMetadata";
export const metadata = privateMetadata("Beheer", "/admin");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
