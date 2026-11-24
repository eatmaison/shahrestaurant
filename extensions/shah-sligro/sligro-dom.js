(() => {
  if (location.origin !== 'https://www.sligro.nl'
    || !/^\/p\.[0-9]{5,12}\.html\/[a-z0-9_-]+\.html$/.test(location.pathname)) return {state:'unavailable'};
  // A verified signed-in supplier response for an obsolete product. Unlike a
  // verification gate, it must not stop the remainder of the inventory run.
  if (/^402 Out of assortment \| Sligro\.nl$/i.test(document.title.trim())) return {state:'out-of-assortment'};
  // Read only scoped, rendered product labels. Do not inspect authentication DOM,
  // cookies, hidden page state, application endpoints, or customer identifiers.
  const visible = el => {
    if (!el || !el.getClientRects().length || el.closest('[hidden], [aria-hidden="true"]')) return false;
    const style = getComputedStyle(el);
    return style.visibility === 'visible' && style.opacity !== '0';
  };
  const nodes = (scope, selector) => Array.from(scope.querySelectorAll(selector)).filter(visible);
  const label = el => el.innerText.replace(/[\s\u00a0\u202f]+/gu,' ').trim();
  const values = (scope, selector) => nodes(scope,selector).map(label);
  const one = (scope, selector) => {
    const hits = nodes(scope,selector);
    return hits.length === 1 ? hits[0] : null;
  };
  const root = one(document,'.cmp-productdetail-top');
  const price = root && one(root,'.cmp-productdetail__price');
  const hasPrice = price && nodes(price,'.cmp-price__price, .cmp-price__old').length > 0;
  const login = !hasPrice && nodes(document,'a[href^="/inloggen.html"], a[href^="https://www.sligro.nl/inloggen.html"]')
    .filter(link => {
      if (label(link).toLowerCase() !== 'inloggen') return false;
      const u = new URL(link.href);
      if (u.origin !== location.origin || u.pathname !== '/inloggen.html' || u.hash) return false;
      if (u.searchParams.get('target') === location.pathname && [...u.searchParams].length === 1) return true;
      // The public header starts with a bare href; normal site click handling
      // adds target dynamically. Links in an unrelated footer are not evidence.
      return !u.search && Boolean(link.closest('header, [role="banner"], .site-header, #site-header'));
    }).length === 1;
  if (login) return {state:'logged-out'};
  if (!root || !price) return {state:'loading'};
  const info = values(root,'.cmp-productdetail__head .cmp-productdetail__subinfo');
  if (!info.length) return {state:'loading'};
  const dates = values(root,'.cmp-product-labels__notification--discount-duration > span');
  return {
    state: 'rendered-product',
    articleLabels: info,
    packLabels: values(price,'.cmp-price__unit'),
    regularPromoLabels: values(price,'.cmp-price__folder .cmp-price__old'),
    currentPromoLabels: values(price,'.cmp-price__folder .cmp-price__new.cmp-price__price'),
    standaloneLabels: nodes(price,'.cmp-price__price')
      .filter(el => !el.closest('.cmp-price__folder')).map(label),
    hasPromoLayout: nodes(price,'.cmp-price__folder').length > 0,
    promoDateLabels: dates,
    depositLabels: values(root,'.cmp-productdetail__price-packagingcost'),
    taxLabels: values(document,'p.cmp-tax-disclaimer'),
  };
})();
