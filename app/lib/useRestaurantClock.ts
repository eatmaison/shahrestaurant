"use client";
import { useEffect, useState } from "react";
import { amsterdamDateTime } from "./restaurantClock";

export function useRestaurantClock(): string {
  const [now, setNow] = useState("");
  useEffect(() => {
    let active = true;
    const update = () => { if (active && !document.hidden) setNow(amsterdamDateTime()); };
    queueMicrotask(update);
    const interval = window.setInterval(update, 30_000);
    document.addEventListener("visibilitychange", update);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, []);
  return now;
}
