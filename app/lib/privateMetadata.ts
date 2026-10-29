import type { Metadata } from "next";
export function privateMetadata(title: string, path: string): Metadata {
  return { title: { absolute: `${title} | Shah Restaurant` }, alternates: { canonical: path }, robots: { index: false, follow: false }, referrer: "no-referrer" };
}
