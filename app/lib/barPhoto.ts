/** Versioned replacement; legacy saved event references resolve without rewriting data. */
export const BAR_PHOTO_SRC = "/brand/edited-restaurant-photos-v1/bar-shine-960.webp";

export function currentBarPhoto(src: string): string {
  return src === "/brand/shah-bar-v1.webp" || src === "/photos/687A0343.jpeg" ? BAR_PHOTO_SRC : src;
}
