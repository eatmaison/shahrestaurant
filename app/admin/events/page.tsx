import AdminEvents from "../AdminEvents";
import { privateMetadata } from "../../lib/privateMetadata";
export const metadata = privateMetadata("Evenementen", "/admin/events");
export default function Page() { return <AdminEvents />; }
