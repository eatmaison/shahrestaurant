import EventPage from "../../../events/about/page";
import { eventMetadata } from "../../../lib/eventSeo";

export const metadata = eventMetadata("eventsAbout", "en");

export default function Page() { return <EventPage />; }
