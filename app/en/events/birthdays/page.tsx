import EventPage from "../../../events/birthdays/page";
import { eventMetadata } from "../../../lib/eventSeo";

export const metadata = eventMetadata("eventsBirthdays", "en");

export default function Page() { return <EventPage />; }
