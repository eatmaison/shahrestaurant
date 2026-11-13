"use client";
import { useEffect, useState } from "react";
import { useLang } from "../providers";
import { CustomerDirectory } from "./CustomerDirectory";
import { RecentVisitors } from "./RecentVisitors";
import styles from "./admin.module.css";

export default function AdminCustomers() {
  const { lang } = useLang(), nl = lang === "nl";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(timer); }, []);
  return <div className={styles.stack}><nav className={styles.sectionLinks} aria-label={nl ? "Klantonderdelen" : "Customer sections"}><a href="#workspace-users">{nl ? "Accountregister" : "Account directory"}</a><a href="#workspace-visitors">{nl ? "Recent online" : "Recently online"}</a></nav><CustomerDirectory now={now} /><RecentVisitors now={now} /></div>;
}
