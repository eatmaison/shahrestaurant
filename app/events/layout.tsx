import { eventMetadata } from "../lib/eventSeo";
import { EventsShell } from "../components/EventsShell";

export const metadata = eventMetadata("events", "nl");

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsShell locale="nl">{children}</EventsShell>;
}
