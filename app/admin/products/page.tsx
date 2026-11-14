import AdminProducts from "../AdminProducts";
import { privateMetadata } from "../../lib/privateMetadata";
export const metadata = privateMetadata("Productbeheer", "/admin/products");
export default function Page() { return <AdminProducts />; }
