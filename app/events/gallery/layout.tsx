import { eventMetadata } from "../../lib/eventSeo";

export const metadata = eventMetadata("eventsGallery", "nl");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
