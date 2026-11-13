import AdminStats from "../AdminStats";
import { privateMetadata } from "../../lib/privateMetadata";
export const metadata = privateMetadata("Statistieken", "/admin/stats");
export default function Page() { return <AdminStats />; }
