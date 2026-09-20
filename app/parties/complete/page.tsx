import type { Metadata } from "next";
import PartyConfirmation from "./PartyConfirmation";

export const metadata: Metadata = { title: "Your Party Booking", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function PartyCompletePage() { return <PartyConfirmation />; }