import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "../lib/serverStore";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartiesLayout({ children }: { children: React.ReactNode }) {
  if ((await getCurrentUser())?.role !== "admin") notFound();
  return children;
}
