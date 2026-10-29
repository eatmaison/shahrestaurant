import { privateMetadata } from "../lib/privateMetadata";
export const metadata = privateMetadata("Kassa", "/terminal");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
