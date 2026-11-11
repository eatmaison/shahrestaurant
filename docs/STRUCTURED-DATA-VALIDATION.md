# Structured data verification — 11 November 2026

The emitted Dutch homepage business graph was checked with Google's official Rich Results Test in CODE mode, using public restaurant data. No localhost URL or unpublished website was deployed.

Result: **2 valid items detected**:
- Local businesses: 1 valid Restaurant item.
- Organisation: 1 valid item.
- One non-critical warning: missing optional priceRange.

Test result: https://search.google.com/test/rich-results/result?id=nsFbGi_Lng-DoAcVPq8sBw
Restaurant detail: https://search.google.com/test/rich-results/result/r%2Flocal-business?id=nsFbGi_Lng-DoAcVPq8sBw

The prior priceRange "???" was removed. A fabricated price category was not inserted to silence the optional warning. Unverified coordinates and social identities remain omitted.

Scope: this Google run validates the shared Restaurant/Organization graph submitted as code. It is not a live URL inspection, does not prove indexing or rich-result display, and is not a separate Google validation of every locale route or of Menu/FAQ/Breadcrumb entities.

Local production checks cover all ten public URLs, parse JSON-LD, confirm visible eight-question FAQ equality, and confirm that Menu schema uses the actual visible runtime dishes. Restaurant/Organization/WebSite/ImageObject come from one shared helper; BreadcrumbList comes from the public wrapper; FAQPage appears on both home languages; Menu/Section/Item/Offer is populated from visible actual menu data after catalogue hydration. The read-only fixture is explicit, not a claim that live prices or reviews were checked.

SearchAction is omitted because there is no actual URL-addressable site search. AggregateRating and Review markup are omitted rather than promising unsupported own-business review stars. SuitableForDiet is not guessed from ingredients. Field/business facts still needing evidence include price range, exact coordinates, sameAs profiles, current transit details, facilities and accessibility.

The Google test's code/result can expire. Search Console submission and public URL validation remain for an authorized deployment; neither occurred in this task.
