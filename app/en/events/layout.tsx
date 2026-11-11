import { eventMetadata } from "../../lib/eventSeo";
import { EventsShell } from "../../components/EventsShell";

export const metadata = eventMetadata("events", "en");

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsShell locale="en">{children}</EventsShell>;
}
