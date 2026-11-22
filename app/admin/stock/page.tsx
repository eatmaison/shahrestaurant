import { privateMetadata } from "../../lib/privateMetadata";
import AdminStock from "./AdminStock";

export const metadata = privateMetadata("Voorraad", "/admin/stock");
export default function Page() { return <AdminStock />; }
