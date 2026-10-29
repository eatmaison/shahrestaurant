# Shah Restaurant — vēl 55 uzlabojumi

2026-10-27. Šis ir nākamais uzlabojumu komplekts pēc `c53f657`, tikai `nn/shahrestaurant` projektam. Iepriekšējā visu triju vietņu komplekta darbi nav skaitīti vēlreiz. Vienas funkcijas saistītie labojumi apvienoti vienā punktā.

| Nr. | Jaunais uzlabojums | Galvenie faili |
|---|---|---|
| 1 | Pasūtīšanas lapa izmanto vienu kopīgu sākotnējo datu ielādi; izņemts tās dublētais pieprasījums un atsevišķā rezerves kataloga kopija. | `app/order/page.tsx` |
| 2 | Ēdienkartes ielādes kļūme ir redzama apmeklētājam ar atkārtošanas pogu un restorāna tālruni. | `CatalogFeedback.tsx`, `providers.tsx` |
| 3 | Nederīga sākotnējo datu atbildes struktūra tiek noraidīta, saglabājot iepriekšējo katalogu, nevis izraisot renderēšanas kļūdu. | `providers.tsx` |
| 4 | Atjaunojoties internetam pēc kataloga kļūmes, katalogs tiek ielādēts atkārtoti. | `providers.tsx` |
| 5 | Atjaunojot lapu no pārlūka atpakaļ/uz priekšu kešatmiņas, tiek atsvaidzināti arī sesijas un kataloga dati. | `providers.tsx` |
| 6 | Sākumlapas ēdienu fotogrāfijām izmantoti optimizēti, faktiskajam kartītes/dialoga izmēram pielāgoti attēli. | `app/page.tsx`, `ProductImage.tsx` |
| 7 | Pēc administratora nomainīta attēla URL agrākā attēla kļūdas stāvoklis vairs nepaliek spēkā; jaunais attēls tiek mēģināts ielādēt. | `ProductImage.tsx` |
| 8 | Sākumlapas dialogu kods atdalīts un tiek ielādēts, atverot dialogu. | `app/page.tsx` |
| 9 | Izņemts neizmantotais WebGL renderētājs un tikai tam vajadzīgās `three`/tipu atkarības; instalācijā izņemtas astoņas pakotnes. | `HomeDepth.tsx`, `package*.json` |
| 10 | Ēdienu/reitingu atlases un valūtas/datumu formatētāji netiek pārrēķināti pie katras nesaistītas sākumlapas stāvokļa izmaiņas. | `app/page.tsx` |
| 11 | Dekoratīvā sākumlapas video kadru pārrēķināšana apstājas arī tad, kad video apgabals ir ārpus ekrāna. | `app/page.tsx` |
| 12 | Ja dekoratīvais video neielādējas, tas tiek paslēpts, atstājot restorāna foto fonu. | `app/page.tsx` |
| 13 | Meklēšana atpazīst diakritisko zīmju variantus: piemēram, `creme` atrod arī `crème`. | `menuSearch.ts` |
| 14 | Sākumlapas meklēšana atpazīst vairākus vārdus neatkarīgi no to secības. | `menuSearch.ts`, `app/page.tsx` |
| 15 | Pasūtīšanas lapā var meklēt arī pēc sastāvdaļām un alergēnu tekstiem. Tas ir teksta meklējums, nevis garantija par alergēnu neesamību. | `menuSearch.ts`, `app/order/page.tsx` |
| 16 | Pasūtīšanas meklēšanas filtrēšana atlikta ar `useDeferredValue`, lai ievade būtu atsaucīgāka; meklējuma ievade ierobežota līdz 120 rakstzīmēm. | `app/order/page.tsx` |
| 17 | No sākumlapas ēdiena var nonākt pie konkrētā ēdiena pasūtīšanas lapā, izmantojot `?dish=...`; tas saglabāts arī produktu piedāvājumu saitēs. | `app/page.tsx`, `app/order/page.tsx` |
| 18 | Sākumlapas produkta dialogā formatētais apraksts tiek parādīts kā attīrīts teksts ar formatējumu, nevis ar redzamiem HTML tagiem. | `RichDescription.tsx`, `app/page.tsx` |
| 19 | Fotogalerijas dialogā Home/End ļauj pāriet uz pirmo/pēdējo attēlu. | `app/page.tsx` |
| 20 | Atsauksme ar nederīgu datuma vērtību vairs nevar salauzt sākumlapas datumu formatēšanu. | `app/page.tsx` |
| 21 | Pirms pasūtījuma nosūtīšanas tiek aktivizēta redzamo kontaktlauku pārlūka validācija gan datorā, gan mobilajā dialogā. | `app/order/page.tsx` |
| 22 | Abos pasūtījuma kontaktu skatos pievienoti lauku nosaukumi, automātiskā aizpilde, tālruņa/e-pasta tastatūras, ievades robežas un pasta indeksa norādes. Piezīme ierobežota līdz servera atļautajām 500 rakstzīmēm. | `app/order/page.tsx` |
| 23 | Groza daudzuma pogas palielinātas līdz 44 px, saņēmušas konkrētā ēdiena nosaukumu un palielināšanas poga atspoguļo sasniegto 99 gabalu robežu. | `app/order/page.tsx` |
| 24 | Ēdienu grozā novērsts kļūdains visu pozīciju daudzumu apzīmējums kā `drinks`; tagad izmantots vispārīgs vienību apzīmējums. | `app/order/page.tsx` |
| 25 | Lojalitātes punktu slīdnim pievienots pieejams nosaukums/vērtība; plānotās piegādes režīma pogas paziņo izvēlēto stāvokli. | `app/order/page.tsx` |
| 26 | Plānotam vienreizējam pasūtījumam serveris pieprasa īstu kalendāra datumu un datuma esamību. | `validation.ts` |
| 27 | Pasūtījuma kļūdas un sekmīgie paziņojumi abos izrakstīšanās skatos saņēmuši atbilstošas ekrānlasītāja paziņojumu lomas. | `app/order/page.tsx` |
| 28 | Pasūtījuma nosūtīšanai pievienots 45 sekunžu termiņš. Neskaidras tīkla kļūmes gadījumā saglabājas iepriekšējā idempotences atslēga, un HTTP kļūda netiek uztverta kā izveidots pasūtījums. | `providers.tsx` |
| 29 | Pieteikšanās un reģistrācijas pieprasījumiem ir termiņš; HTTP kļūda ar maldinošu `ok` saturu netiek pieņemta kā sekmīga autentifikācija. | `providers.tsx` |
| 30 | Reģistrācijā jāpārbauda paroles atkārtojums; paroli var apzināti parādīt/paslēpt. | `account/page.tsx` |
| 31 | Konta kļūda saņem fokusu un saistību ar formu; noņemts dubultais H1, un konta veida/pieteikšanās režīma pogām pievienots izvēles stāvoklis. | `account/page.tsx` |
| 32 | E-pasta apstiprinājuma atkārtotas sūtīšanas tūlītējs aizslēgs aptur dubultklikšķa atkārtojumus; pieprasījumam ir termiņš. | `account/page.tsx` |
| 33 | Izrakstīšanās ir aizsargāta pret atkārtotu nospiešanu; servera kļūmes gadījumā profils netiek maldinoši iztīrīts un lietotājs redz kļūdu. | `account/page.tsx`, `providers.tsx` |
| 34 | VIP foto pirms lasīšanas pārbauda formātu un 5 MB robežu; augšupielādei/pirkumam ir nosūtīšanas aizslēgs, kļūdu paziņojumi un pieprasījumu termiņi. | `account/page.tsx`, `providers.tsx` |
| 35 | Atsauksmju nosūtīšanai pievienoti aizslēgi, pieejami vērtējuma stāvokļi un kļūdu paziņojumi. Kļūmes gadījumā lietotāja ierakstītais teksts paliek formā. | `account/page.tsx`, `reservations/page.tsx`, `providers.tsx` |
| 36 | Atsauksmju API pārbauda vienu derīgu pasūtījuma/rezervācijas UUID, veselu vērtējumu 1–5 un teksta garumu līdz 500 rakstzīmēm. | `validation.ts`, `api/reviews/route.ts` |
| 37 | Atsauksmju un maksājuma statusa API kļūmes vairs neizpauž neapstrādātus servera kļūdu tekstus; detaļas saglabājas servera žurnālā. | Attiecīgie API maršruti |
| 38 | E-pasta verificēšanas lapa atšķir nederīgu saiti no īslaicīgas servera/tīkla kļūmes un piedāvā atkārtotu pārbaudi; pieprasījums ir atceļams un ar termiņu. | `verify-email/page.tsx` |
| 39 | Pēc sekmīgas e-pasta verificēšanas tokens tiek izņemts no URL, saglabājot citus parametrus, un profils tiek atsvaidzināts. | `verify-email/page.tsx` |
| 40 | Maksājuma atgriešanās atsauce pieprasījumā tiek URL kodēta, bet serverī pārbaudīta kā UUID pirms datubāzes vaicājuma. | `pay/complete/page.tsx`, maksājuma pārbaudes API |
| 41 | Maksājuma statusa automātiskajām pārbaudēm ir ierobežots mēģinājumu skaits; pametot lapu, tiek atcelts pieprasījums un taimeris. | `pay/complete/page.tsx` |
| 42 | Neapstiprināts/`authorized` maksājums vairs neatstāj bezgalīgu gaidīšanu. Var atkārtoti pārbaudīt statusu; tīkla/HTTP kļūme netiek pasniegta kā pierādīts maksājuma atteikums, un grozs tiek iztīrīts tikai pēc derīga `paid` apstiprinājuma. | `pay/complete/page.tsx` |
| 43 | Rezervācijas viesu skaita robeža saskaņota ar servera 1–40. Lauku var normāli iztukšot un rediģēt; lielākām grupām pieejama tālruņa saite. | `reservations/page.tsx` |
| 44 | Mainot rezervācijas datumu vai laikam kļūstot nederīgam, iepriekš izvēlētais ierašanās laiks tiek iztīrīts; laiku nevar izvēlēties pirms datuma. | `reservations/page.tsx` |
| 45 | Skaidri izskaidrota pirmdienas slēgšana, beigušies šodienas laiki un Amsterdamas laika josla. Pasūtījuma datums vairs nebalstās UTC datumā. | Rezervāciju/pasūtījumu lapas, `useRestaurantClock.ts` |
| 46 | Pirms rezervācijas nosūtīšanas redzams izvēlētā datuma, laika un viesu skaita kopsavilkums. | `reservations/page.tsx` |
| 47 | Pēc sekmīgas rezervācijas fokuss pāriet uz apstiprinājuma virsrakstu. | `reservations/page.tsx` |
| 48 | Rezervācijas apstiprinājumam pievienota `.ics` kalendāra lejupielāde ar pareizu Amsterdamas vasaras/ziemas laiku, rezervācijas statusu un bez klienta kontaktinformācijas. Formāts balstīts [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545). | `reservationCalendar.ts`, `restaurantClock.ts` |
| 49 | Pirms rezervācijas atcelšanas tiek prasīts konkrētās rezervācijas apstiprinājums. Ir aizslēgs un kļūdas atbilde; jau pagājis šodienas ierašanās laiks netiek rādīts kā vēl atceļama nākotnes rezervācija. | `reservations/page.tsx`, `providers.tsx` |
| 50 | Interaktīvā Google karte un tās ārējie skripti tiek ielādēti tikai pēc klikšķa. Adrese un maršruta saite pieejama uzreiz. | `LocationMap.tsx` |
| 51 | Privāto konta/administrācijas un tehnisko lapu esošie `noindex` metatagi papildināti ar HTTP galveni un stingrāku referrer politiku; tām pievienoti atšķirīgi nosaukumi un atbilstoši canonical URL. | Privātie izkārtojumi, `privateMetadata.ts`, `next.config.ts` |
| 52 | `robots.txt` norāda tehniskās un privātās administrācijas/pasākumu sadaļas, netraucējot publiskā menu un rezervāciju lapu pārbaudei. Tas neaizstāj autentifikāciju. | `robots.ts` |
| 53 | Publiskās `www` lapas pastāvīgi novirza uz galveno domēnu, saglabājot ceļu un parametrus. API maksājumu POST pieprasījumi netiek novirzīti. | `proxy.ts` |
| 54 | Pievienots 1200×630 Shah kopīgošanas attēls, atjaunoti sākumlapas/menu/rezervāciju sociālie metadati un saskaņots restorāna strukturēto datu identifikators. | Sociālie attēli, lapu izkārtojumi, `app/page.tsx` |
| 55 | Instalējamās vietnes apraksts un īsceļi pielāgoti holandiešu valodai un publiskajām darbībām. Pievienotas Shah zīmola PWA, maskējamā un Apple ikonas, izņemts publiskais kases īsceļš un piespiedu portreta orientācija. | `manifest.ts`, `public/shah-*` |

Papildus sakārtots ielādes paziņojums holandiešu/angļu valodā bez ligzdota `main`, pievienotas fokusa atkāpes zem fiksētās galvenes, e-pasta aplaušana šaurajā kājenē, uzlabots fokusa rāmītis piespiedu kontrasta režīmā un rezervācijas piezīmes rakstzīmju skaitītājs.

## Pārbaudes

- Produkcijas kompilācija un TypeScript.
- 41 jauna mērķēta pārbaude meklēšanai, īstiem datumiem, vasaras/ziemas laikam, kalendāra privātumam/formātam un atsauksmju shēmai.
- Jauno pārlūka plūsmu testi un iepriekšējā Shah pārlūka komplekta regresijas pārbaude. Testu iesniegumi ir aizvietoti; nav veidoti īsti pasūtījumi, maksājumi vai rezervācijas un nav sūtīti testa e-pasti.
- Mainīto failu ESLint pārbaudē nav kļūdu; sākotnējās divas šajos failos novērstas.
- Publicēšanas rezultāti, precīzās versijas un mērījumi saglabāti uzdevuma darba mapē `shah-improvements-20261027`.

Vienotās datubāzes struktūra, cenas, atlaides, piegādes zonas, faktiskā maksājumu saskaņošana un e-pastu nosūtīšanas biznesa loģika nav mainīta. Darba laiki paliek otrdien–svētdien 15:00–22:00, pirmdien slēgts, ar administratora atvēršanas iespēju. Shah Party/Events aizsardzība saglabāta. Šajā komplektā citu restorānu repozitoriji nav laboti.
