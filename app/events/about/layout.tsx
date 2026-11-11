import { eventMetadata } from "../../lib/eventSeo";

export const metadata = eventMetadata("eventsAbout", "nl");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
