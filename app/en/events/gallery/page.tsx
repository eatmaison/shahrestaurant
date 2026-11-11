import EventPage from "../../../events/gallery/page";
import { eventMetadata } from "../../../lib/eventSeo";

export const metadata = eventMetadata("eventsGallery", "en");

export default function Page() { return <EventPage />; }
