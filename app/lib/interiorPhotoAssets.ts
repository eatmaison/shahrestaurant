// Responsive delivery copies of the original Shah Restaurant photography.
type InteriorPhoto = Readonly<{
  src: string;
  width: number;
  height: number;
  avifSrcSet: string;
  webpSrcSet: string;
  jpegSrcSet: string;
  blurDataURL: string;
}>;

const photos: Readonly<Partial<Record<string, InteriorPhoto>>> = {
  "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-320.avif 320w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-640.avif 640w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-960.avif 960w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-320.webp 320w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-640.webp 640w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-960.webp 960w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-320.jpg 320w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-640.jpg 640w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-960.jpg 960w, /brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAABwBACdASoSAAwAPv1orE6rJiQiMAgBYB+JYgCdICXDACoQTeVV7dkWFh7PQAD+6fPAKQR+YeA3RI0l+C/ZPcCJJpu9kB8OVikQcnRaObqTjc8qCh823OkWzkUoiADm/BU4kIkQCOIrGAAA"
  },
  "/brand/shah-interior-photos-v1/shah-hanglampen-etes-960.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-hanglampen-etes-320.avif 320w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-640.avif 640w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-960.avif 960w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-hanglampen-etes-320.webp 320w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-640.webp 640w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-960.webp 960w",
    "width": 960,
    "height": 1440,
    "src": "/brand/shah-interior-photos-v1/shah-hanglampen-etes-960.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-hanglampen-etes-320.jpg 320w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-640.jpg 640w, /brand/shah-interior-photos-v1/shah-hanglampen-etes-960.jpg 960w",
    "blurDataURL": "data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAABwBACdASoSABsAPv1wsFGrJiSiqAqpYB+JYgAAJsCDu1/dWjjEbGOb0tN8ZAD+qagjV2USiY0d+WF/5yNb/hv0xptXu8AL0W8204mqYnBbveH/5HChun7lJqQf0HEcEnKrHxLjWlvS2R55E52ir/PB6l2m77VfRH0hTDf7KtNE/8HsB5X7lSpE8OIbbaX0zWxzr1JC095n2T0ZbKkFNE+DYr4NJgSgMtWUqMUN5G85DwRAigOD8xCrKAAAAA=="
  },
  "/brand/shah-interior-photos-v1/shah-bar-barkrukken-960.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-bar-barkrukken-320.avif 320w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-640.avif 640w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-960.avif 960w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-bar-barkrukken-320.webp 320w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-640.webp 640w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-960.webp 960w",
    "width": 960,
    "height": 1440,
    "src": "/brand/shah-interior-photos-v1/shah-bar-barkrukken-960.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-bar-barkrukken-320.jpg 320w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-640.jpg 640w, /brand/shah-interior-photos-v1/shah-bar-barkrukken-960.jpg 960w",
    "blurDataURL": "data:image/webp;base64,UklGRowAAABXRUJQVlA4IIAAAABQBACdASoSABsAPv1yrlIrJqQiqAqpYB+JQBadAiS+WquHhmg4It49QJwOAP7wyy4MbhjB7ipeTqB3nfkDN4FKIVMm+nJ9kXjU84K9L8g7nyJELdwToMK3mTPE1azn3qJmTVGvRN/7cSSy4p4xVb4mtKS7trkmrm3jpiVtBAAAAA=="
  },
  "/brand/shah-interior-photos-v1/shah-glazen-entree-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-glazen-entree-320.avif 320w, /brand/shah-interior-photos-v1/shah-glazen-entree-640.avif 640w, /brand/shah-interior-photos-v1/shah-glazen-entree-960.avif 960w, /brand/shah-interior-photos-v1/shah-glazen-entree-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-glazen-entree-320.webp 320w, /brand/shah-interior-photos-v1/shah-glazen-entree-640.webp 640w, /brand/shah-interior-photos-v1/shah-glazen-entree-960.webp 960w, /brand/shah-interior-photos-v1/shah-glazen-entree-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-glazen-entree-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-glazen-entree-320.jpg 320w, /brand/shah-interior-photos-v1/shah-glazen-entree-640.jpg 640w, /brand/shah-interior-photos-v1/shah-glazen-entree-960.jpg 960w, /brand/shah-interior-photos-v1/shah-glazen-entree-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAACwAwCdASoSAAwAPv1orE6rJiQiMAgBYB+JYgCdMoSA2APLdZvWgAD+v/0MBK4qkLBBwMcQmFddYRTCrp5iGx8agilmuuySGwr3Y+SLCTu8lUopAGVpHvlxX94gwq5wA6SIrQAA"
  },
  "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-320.avif 320w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-640.avif 640w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-960.avif 960w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-320.webp 320w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-640.webp 640w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-960.webp 960w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-320.jpg 320w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-640.jpg 640w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-960.jpg 960w, /brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAABQBACdASoSAAwAPv1orE6rJaQiMAgBYB+JYgCdMoR3ACA5t1WcLXpEU/6EAP51ZBY+SsBZ6mO3iA0PyGZgSmm0Ab6oVmDayaTkpJmhWvUdZweADHj/Eu0Z0Wb+vRmkvsJNXwKQ3iYWvgAA"
  },
  "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-320.avif 320w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-640.avif 640w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.avif 960w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-320.webp 320w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-640.webp 640w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.webp 960w",
    "width": 960,
    "height": 1440,
    "src": "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-320.jpg 320w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-640.jpg 640w, /brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.jpg 960w",
    "blurDataURL": "data:image/webp;base64,UklGRr4AAABXRUJQVlA4ILIAAAAQBQCdASoSABsAPv1oq06rJiOiMAgBYB+JYgC2yBkRGDIEJcTySXzn717q8ITD+ygAAP7d6e5VgoiDiH1j6d4QoIUfzFJqs+V89FoWwKPI5jogDSM8bKW0vyYJDYHFO47rG2Xjz/TnlXe7T4sPYOBVpTREqtozprjuStNb5BTe5kOwJanc+MxXlOmHdUaZGnEmLJlvGuQmN8Q+bC146w74L5owNYvfPRsgioy+RZTFwAAA"
  },
  "/brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-bar-flessenrek-320.avif 320w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-640.avif 640w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-960.avif 960w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-bar-flessenrek-320.webp 320w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-640.webp 640w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-960.webp 960w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-bar-flessenrek-320.jpg 320w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-640.jpg 640w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-960.jpg 960w, /brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAACwAwCdASoSAAwAPv1oq06rJaOiMAgBYB+JYgCdACKcqUjB9IU2MAD+41IC13zaLLS4/5mXmj46Rg5mMU0z8T3HM4vazYwixq0SK0o5DIIQah6V1Zt1r+pxaBHPIXSAlHkB/urtgAA="
  },
  "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-320.avif 320w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-640.avif 640w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-960.avif 960w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-320.webp 320w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-640.webp 640w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-960.webp 960w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-320.jpg 320w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-640.jpg 640w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-960.jpg 960w, /brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAADQAwCdASoSAAwAPv1orE6rJiQiMAgBYB+JQBOjXAW/+AfVOf81lmAA/ulJoAv4i/Kugvybefceut+ZBD3HenVh7DsCVmsCoNfPbacg9cfG+Iuf4NkUnqGS+5bL++TwajXs7Mn9oRMlxyx9nxgAAA=="
  },
  "/brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-gedekte-tafel-320.avif 320w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-640.avif 640w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-960.avif 960w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-gedekte-tafel-320.webp 320w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-640.webp 640w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-960.webp 960w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-gedekte-tafel-320.jpg 320w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-640.jpg 640w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-960.jpg 960w, /brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoSAAwAPv1orE6rJiQiMAgBYB+JYwCdACKdtaEePVakXyAA/unuHJR0kKJLKYYNrrjiaalL9Embn/JkH8qRlrFKtQQ8YbIApsfLJcsq8AA="
  },
  "/brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.jpg": {
    "avifSrcSet": "/brand/shah-interior-photos-v1/shah-planten-vensterbank-320.avif 320w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-640.avif 640w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-960.avif 960w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.avif 1440w",
    "webpSrcSet": "/brand/shah-interior-photos-v1/shah-planten-vensterbank-320.webp 320w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-640.webp 640w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-960.webp 960w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.webp 1440w",
    "width": 1440,
    "height": 960,
    "src": "/brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.jpg",
    "jpegSrcSet": "/brand/shah-interior-photos-v1/shah-planten-vensterbank-320.jpg 320w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-640.jpg 640w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-960.jpg 960w, /brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.jpg 1440w",
    "blurDataURL": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAABQAwCdASoSAAwAPv1oq06rJaOiMAgBYB+JYwCw7BhmOqbgYAD+0Swv+zHdEbQ3fsNOUTBAnebadr0x8v6bo3JSfMK9kxVahtre5rL58znZqhN6lh7JN86XDxlIOXfdXQAAAA=="
  }
};

export function getInteriorPhoto(src: string) {
  return Object.hasOwn(photos, src) ? photos[src] : undefined;
}
