import AdminCustomers from "../AdminCustomers";
import { privateMetadata } from "../../lib/privateMetadata";
export const metadata = privateMetadata("Klanten en bezoekers", "/admin/customers");
export default function Page() { return <AdminCustomers />; }
