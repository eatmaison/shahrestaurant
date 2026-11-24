(() => {
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
  const login = nodes(document,'a[href^="/inloggen.html"], a[href^="https://www.sligro.nl/inloggen.html"]')
    .some(link => {
      const u = new URL(link.href);
      return u.origin === location.origin && u.pathname === '/inloggen.html'
        && u.searchParams.get('target') === location.pathname;
    });
  const root = one(document,'.cmp-productdetail-top');
  if (!root) return login ? {state:'logged-out'} : {state:'loading'};
  const info = values(root,'.cmp-productdetail__head .cmp-productdetail__subinfo');
  const price = one(root,'.cmp-productdetail__price');
  if (!price || !info.length) return login ? {state:'logged-out'} : {state:'loading'};
  if (login) return {state:'logged-out'};
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
