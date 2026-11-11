# Verified local facts — 11 November 2026

Only supported information is added to the public pages/schema. Existing restaurant details remain authoritative for the business name, address, contact details and opening hours.

## Address coordinates

PDOK's official [Locatieserver documentation](https://www.pdok.nl/pdok-locatieserver) describes its current government-register geocoder. Its [BAG address query](https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=Klaprozenweg%2036a%201032KL%20Amsterdam&fq=type%3Aadres&rows=5&fl=id,weergavenaam,centroide_ll,nummeraanduiding_id,bron) returned the exact result `Klaprozenweg 36A, 1032KL Amsterdam`, source BAG, address identifier `0363200012168393`, point `POINT(4.91025655 52.39763814)`. The A-1/A-2 units are separate results and were not used.

Restaurant GeoCoordinates now use latitude 52.39763814 and longitude 4.91025655. This is the registered address point, not a measured entrance, accessible route or walking-time assertion. The public website already displays that exact address. Web extraction could not open the JSON endpoint; a direct read-only HTTPS request to the documented official API returned the result successfully.

## Public transport and parking

The official [GVB Klaprozenweg stop page](https://www.gvb.nl/reisinformatie/halte/NL%3AS%3A30001401) lists bus 38. A current [GVB line-38 timetable](https://www.gvb.nl/reisinformatie/halte/pdf?direction=Outbound&lineNumber=38&startDate=2026-11-10&stopCode=NL%3AS%3A30001450) also lists Klaprozenweg on its route. These official results were retrieved on the audit date. Static web extraction returned an access error for the full stop/timetable responses, so the page does not copy a schedule or promise a departure time. The public arrival block states only that bus 38 serves Klaprozenweg, with links to current GVB information and a journey planner.

The [City of Amsterdam parking map](https://www.amsterdam.nl/parkeren/parkeertarieven-kaart/) lets visitors search by street for zones, prices and paid hours. The arrival block links to it for current municipal conditions. That source does not establish a private car-park entitlement, a reserved space or guaranteed availability. The separate KARWEI guidance below comes from the owner's later confirmation.

## Facts still not established

No verified entrance-to-stop walking route/time, nearest-stop comparison, bicycle-space availability, accessible entrance/toilet details, terrace availability, children's facilities or in-restaurant payment methods has been established. Guests are directed to contact the restaurant for facilities. Search snippets from unrelated same-named restaurants were not used.

## Owner-confirmed facts

In this session on 11 November 2026, the owner confirmed that guests typically spend approximately €35 per person, walk-ins have tables available, and no official social profiles currently exist. The introduction and Restaurant priceRange now describe the approximate typical spend, not a fixed meal price. The FAQ welcomes walk-ins and offers a phone contact for a particular time or group; it does not promise unlimited real-time availability. sameAs remains omitted because there are no official profiles to identify.

The owner first described free parking across the road near JYSK, KARWEI and Kwantum. [JYSK's store page](https://jysk.nl/winkels/amsterdam-noord/klaprozenweg), [KARWEI's store page](https://www.karwei.nl/vestigingen/amsterdam-noord) and [Kwantum's page](https://www.kwantum.nl/winkels/amsterdam-noord) confirm those local stores. Kwantum explicitly advertises only the first 1.5 hours free, followed by paid parking. On clarification, the owner identified **KARWEI specifically** as the free all-day option. Public wording therefore names KARWEI across the road and tells visitors to follow posted conditions. It does not describe Kwantum/JYSK as unlimited free parking or promise 24-hour access. The free KARWEI fact is owner-confirmed; it is not a parking entitlement independently established by a site visit.

## Genuine search action

The menu now accepts a real locale-aware GET query at `/menukaart?q=...` and `/en/menu?q=...`; schema advertises those exact targets after implementation. This is ordinary menu functionality and [Schema.org SearchAction](https://schema.org/SearchAction) semantics. [Google removed the sitelinks search box in November 2024](https://developers.google.com/search/blog/2024/10/sitelinks-search-box), including its Rich Results Test report, so no search-box appearance or ranking effect is promised by this markup.
