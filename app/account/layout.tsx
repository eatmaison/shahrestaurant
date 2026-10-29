import { privateMetadata } from "../lib/privateMetadata";
export const metadata = privateMetadata("Mijn account", "/account");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
