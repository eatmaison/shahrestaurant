import { privateMetadata } from "../../lib/privateMetadata";
import Unsubscribe from "./Unsubscribe";

export const metadata = privateMetadata("Afmelden / Unsubscribe", "/email/unsubscribe");

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return <Unsubscribe token={typeof token === "string" ? token : ""} />;
}
