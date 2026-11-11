import EventPage from "../../../events/celebrations/page";
import { eventMetadata } from "../../../lib/eventSeo";

export const metadata = eventMetadata("eventsCelebrations", "en");

export default function Page() { return <EventPage />; }
