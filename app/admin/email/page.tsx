import { privateMetadata } from "../../lib/privateMetadata";
import AdminEmail from "./AdminEmail";

export const metadata = privateMetadata("Email", "/admin/email");
export default function Page() { return <AdminEmail />; }
