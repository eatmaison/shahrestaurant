import { headers } from "next/headers";
import HomeExperience from "./HomeExperience";
import { homeContent } from "./lib/homeContent";

export default async function Home() {
  const requestHeaders = await headers();
  const lang = requestHeaders.get("x-shah-locale") === "en" ? "en" : "nl";
  return <HomeExperience copy={homeContent[lang]} />;
}
