"use client";

import type { IconType } from "react-icons";
import {
  FaApple,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaSnapchat,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYelp,
  FaYoutube,
} from "react-icons/fa6";
import { SiGooglemaps, SiTripadvisor } from "react-icons/si";
import type { SocialPlatform } from "../lib/types";

export interface SocialPlatformInfo {
  id: SocialPlatform;
  label: string;
  icon: IconType;
  /** Brand accent used on the admin page for a colourful, recognisable list. */
  color: string;
}

/** All supported platforms, in display order. */
export const SOCIAL_PLATFORMS: SocialPlatformInfo[] = [
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "#E1306C" },
  { id: "facebook", label: "Facebook", icon: FaFacebookF, color: "#1877F2" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "#010101" },
  { id: "youtube", label: "YouTube", icon: FaYoutube, color: "#FF0000" },
  { id: "snapchat", label: "Snapchat", icon: FaSnapchat, color: "#FFFC00" },
  { id: "telegram", label: "Telegram", icon: FaTelegram, color: "#26A5E4" },
  { id: "linkedin", label: "LinkedIn", icon: FaLinkedinIn, color: "#0A66C2" },
  { id: "x", label: "X (Twitter)", icon: FaXTwitter, color: "#000000" },
  { id: "pinterest", label: "Pinterest", icon: FaPinterestP, color: "#BD081C" },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, color: "#25D366" },
  { id: "googlemaps", label: "Google Maps", icon: SiGooglemaps, color: "#4285F4" },
  { id: "applemaps", label: "Apple Maps", icon: FaApple, color: "#555555" },
  { id: "tripadvisor", label: "Tripadvisor", icon: SiTripadvisor, color: "#34E0A1" },
  { id: "yelp", label: "Yelp", icon: FaYelp, color: "#D32323" },
];
