export const COOKIE_NOTICE_STORAGE_KEY = "tm.cookieConsent";
export const COOKIE_NOTICE_ACK_COOKIE = "shah_notice_ack_v1";
export const COOKIE_NOTICE_ACK_ATTRIBUTE = "data-cookie-notice-ack";
export const COOKIE_NOTICE_ACK_HIDE_CSS = `html[${COOKIE_NOTICE_ACK_ATTRIBUTE}="true"] [data-cookie-notice]{display:none}`;
const ACK_VALUE = "1";
const ACK_MAX_AGE = 60 * 60 * 24 * 365;

export function isCookieNoticeAcknowledged(value: string | undefined): boolean {
  return value === ACK_VALUE;
}

/** Run in the head so a legacy local preference is respected before body paint. */
export function cookieNoticeAcknowledgementBootstrap(): string {
  return `(function(){try{if(localStorage.getItem(${JSON.stringify(COOKIE_NOTICE_STORAGE_KEY)}))document.documentElement.setAttribute(${JSON.stringify(COOKIE_NOTICE_ACK_ATTRIBUTE)},"true");}catch(e){}})();`;
}

/** A non-sensitive, host-only UI acknowledgement; it grants no other permission. */
export function serializeCookieNoticeAcknowledgement(secure: boolean): string {
  return `${COOKIE_NOTICE_ACK_COOKIE}=${ACK_VALUE}; Path=/; Max-Age=${ACK_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
