"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLang } from "../providers";
import { localePath } from "../lib/locale";

/** Keep public navigation in the language of the current URL. */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { lang } = useLang();
  const localizedHref = typeof href === "string"
    ? localePath(href, lang)
    : typeof href.pathname === "string"
      ? { ...href, pathname: localePath(href.pathname, lang) }
      : href;
  return <Link href={localizedHref} {...props} />;
}
