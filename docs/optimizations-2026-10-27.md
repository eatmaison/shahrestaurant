# Vietņu uzlabojumi — 2026-10-27

Tvērums: `shahrestaurant`, `thetandoorcompany`, `eattogo` vienotajā `nn` projektā. Zemāk ir 70 konkrētas koda izmaiņas; vienāda izmaiņa vairākās vietnēs skaitīta vienreiz. **Visas** nozīmē visas trīs vietnes; **S**, **T**, **E** — attiecīgi Shah, The Tandoor Company, EatToGo.

## Veiktās izmaiņas

| Nr. | Uzlabojums un ieguvums | Vietnes / galvenais fails |
|---|---|---|
| 1 | Aizsargāta pārlūka krātuves nolasīšana: bojāts JSON un bloķēta krātuve vairs neaptur lapu. | Visas — `app/lib/clientStorage.ts` |
| 2 | Krātuves rakstīšanas kļūdas un vietas trūkums vairs nesalauž grozu vai tēmas maiņu. | Visas — `clientStorage.ts`, `providers.tsx` |
| 3 | Atjaunotam grozam pārbauda struktūru, pozitīvus veselus daudzumus un neatļautas atslēgas. | Visas — `clientStorage.ts` |
| 4 | Atjaunojot un papildinot grozu, daudzums vienai pozīcijai nepārsniedz 99. | Visas — `providers.tsx` |
| 5 | Grozs sinhronizējas starp viena domēna atvērtajām cilnēm. | Visas — `providers.tsx` |
| 6 | Izvēlētā angļu vai holandiešu valoda saglabājas pēc lapas pārlādes. | Visas — `providers.tsx` |
| 7 | Valodas un gaišās/tumšās tēmas izmaiņas atspoguļojas citās atvērtajās cilnēs. | Visas — `providers.tsx` |
| 8 | Groza atvēršana no citas lapas darbojas arī ar bloķētu `sessionStorage`; tiek saglabāts atmiņā esošais grozs. | Visas — `header.tsx`, `order/page.tsx` |
| 9 | Jaunāks sākotnējo datu pieprasījums atceļ iepriekšējo, lai novecojusi atbilde nepārrakstītu jaunākus datus. | Visas — `providers.tsx` |
| 10 | Noņemot datu nodrošinātāju, tā aktīvie datu/statusa pieprasījumi tiek atcelti. | Visas — `providers.tsx` |
| 11 | Jaunajam kopīgajam pieprasījumu palīgam ir 15 sekunžu termiņš, kas aptver arī JSON atbildes saņemšanu. | Visas — `app/lib/clientFetch.ts` |
| 12 | Restorāna statusa pieprasījumi nepārklājas, ja iepriekšējais vēl nav pabeigts. | Visas — `providers.tsx` |
| 13 | Slēptās cilnēs tiek apturēta periodiska restorāna statusa pārbaude. | Visas — `providers.tsx` |
| 14 | Bezsaistē netiek atkārtoti sūtīti periodiskie statusa pieprasījumi. | Visas — `providers.tsx` |
| 15 | Atgriežoties cilnē vai atjaunojoties internetam, statuss tiek pārbaudīts nekavējoties. | Visas — `providers.tsx` |
| 16 | Īslaicīga sākotnējo datu pieprasījuma kļūme neiztukšo jau parādīto katalogu un grozu. | Visas — `providers.tsx` |
| 17 | API atbildēm norādīta privāta, nesaglabājama kešošanas politika; sākotnējo datu/statusa maršrutos tā norādīta arī tieši. | Visas — `next.config.ts`, API maršruti |
| 18 | API atbildēm pievienots `X-Robots-Tag: noindex, nofollow`, lai tehniskie galapunkti nebūtu meklēšanas rezultātu mērķis. | Visas — `next.config.ts` |
| 19 | Sākotnējo datu/statusa kļūmju atbildes neizpauž klientam datubāzes vai servera kļūdu tekstus; kļūdas paliek servera žurnālā. | Visas — API maršruti |
| 20 | Anonīma lietotāja noteikšana beidzas pirms liekas datubāzes gatavības pārbaudes. | Visas — `app/lib/serverStore.ts` |
| 21 | Pieci neatkarīgi sākotnējo publisko datu vaicājumi izpildās paralēli. | Visas — `serverStore.ts` |
| 22 | Administratora pasūtījumu, lietotāju un VIP pieprasījumu sākotnējā nolasīšana izpildās paralēli. | Visas — `serverStore.ts` |
| 23 | Jau pabeigtas vēsturiskās maksājumu migrācijas pārbaude netiek atkārtota katrā sākotnējo datu pieprasījumā; kļūmes gadījumā iespējams jauns mēģinājums. | Visas — `serverStore.ts` |
| 24 | Servera sākotnējo datu tips importēts ar `import type`, skaidri nodalot to no klienta izpildāmā koda. | Visas — `providers.tsx` |
| 25 | Dekoratīvās dzirksteles pārveidotas par CSS animācijām ar vienādu servera un pārlūka sākotnējo struktūru; novērsta konstatētā hidratācijas kļūda. | S, T — `Atmosphere.tsx`, `optimizations.css` |
| 26 | Izņemta vairs neizmantotā `motion` bibliotēka un tās atkarības. | S, T — `package.json`, bloķējuma fails |
| 27 | Izņemta neizmantotā npm pakotne `git`, samazinot nevajadzīgās instalējamās atkarības. | Visas — `package.json`, bloķējuma fails |
| 28 | Shah smagais sākumlapas video vairs netiek pievienots mobilās ierīcēs, skārienierīcēs vai samazinātas kustības režīmā. | S — `HomeDepth.tsx`, `page.tsx` |
| 29 | Shah video un papildu kustības respektē arī pārlūka datu taupīšanas un lēna 2G savienojuma signālus. | S — `HomeDepth.tsx` |
| 30 | Atļautā Shah video priekšielāde samazināta no visa satura uz metadatiem. | S — `page.tsx` |
| 31 | Shah video kadra pārrēķināšana izlaiž slēptu dokumentu. | S — `page.tsx` |
| 32 | CSS animācijas tiek iepauzētas, kamēr lapa ir fonā. | Visas — `optimizations.css` |
| 33 | Pasūtīšanas produktu attēliem no atbalstītajiem avotiem izmantots Next attēlu izmēru pielāgojums un responsīvs `sizes`. | Visas — `ProductImage.tsx`, `order/page.tsx` |
| 34 | Citu administratora izmantoto ārējo avotu attēli saglabā savietojamību, saņem slinku ielādi, asinhronu dekodēšanu un norādītus izmērus. | Visas — `ProductImage.tsx` |
| 35 | Ja produkta attēls neielādējas, parādās nosaukts aizvietotājs, nevis bojāta attēla ikona. | Visas — `ProductImage.tsx` |
| 36 | Produkta detalizācijas dialoga kods tiek ielādēts pēc vajadzības. | Visas — `order/page.tsx` |
| 37 | Administratora bagātinātā teksta redaktors tiek ielādēts atsevišķi pēc vajadzības. | Visas — `admin/page.tsx` |
| 38 | Teksta redaktoram izslēgta tūlītēja renderēšana servera vidē, novēršot Tiptap SSR inicializācijas problēmu. | Visas — `RichTextEditor.tsx` |
| 39 | Pārejot uz cita produkta saturu, redaktors atjauno savu vērtību bez lieka atgriezeniska `onChange` cikla. | Visas — `RichTextEditor.tsx` |
| 40 | Redaktora rīki saņēmuši `type="button"` un pieejamus nosaukumus; formatēšana nejauši nenosūta apkārtējo formu. | Visas — `RichTextEditor.tsx` |
| 41 | Produkta formatētais apraksts tiek attīrīts ar DOMPurify atļauto tagu/atribūtu sarakstu, saglabājot drošu teksta formatējumu. | Visas — `ProductDetailsModal.tsx` |
| 42 | Produkta detaļas izmanto vietējo dialogu ar fokusa ierobežošanu, Escape, fona bloķēšanu un fokusa atgriešanu. | Visas — `ProductDetailsModal.tsx`, `OrderSheet.tsx` |
| 43 | Dialoga aizvēršanas vadīklām ir lokalizēti teksti un vismaz 44 px ikonas pogas laukums. | Visas — `ProductDetailsModal.tsx` |
| 44 | EatToGo produktu saraksts vairs netiek no jauna montēts katras vecāka stāvokļa izmaiņas laikā; novērsts arī dialoga fokusa atgriešanas defekts. | E — `order/page.tsx` |
| 45 | Atverot mobilo izvēlni, tastatūras fokuss nonāk tās pirmajā saitē. | E, T — `header.tsx` |
| 46 | Escape aizver mobilo izvēlni un atgriež fokusu tās pogai. | E, T — `header.tsx` |
| 47 | Klikšķis ārpus mobilās izvēlnes to aizver; notikumu klausītāji tiek korekti noņemti. | E, T — `header.tsx` |
| 48 | Aktīvajām navigācijas saitēm un valodas/tēmas pogām pievienoti atbilstoši pieejamības stāvokļi. | E, T — `header.tsx` |
| 49 | Konta, administratora un `/parties` saitēm atspējota nevajadzīga iepriekšēja ielāde. | Visas — `header.tsx` |
| 50 | Uzlabota pāriešana tieši uz galveno saturu ar tastatūru: redzama izlaišanas saite un fokusējams galvenais saturs. | Visas — `header.tsx`, `layout.tsx`, CSS |
| 51 | Mobilajos formu laukiem nodrošināts vismaz 16 px teksts, lai iOS fokuss neizraisītu automātisku pietuvināšanu. | Visas — `optimizations.css` |
| 52 | Konta laukiem pievienoti pieejami nosaukumi, atbilstoši tālruņa/e-pasta ievades režīmi un automātiskās aizpildes norādes. | Visas — `account/page.tsx` |
| 53 | Uzņēmuma reģistrācijas laukiem pievienota obligātuma/garuma pārbaude un KVK skaitliska tastatūra. | Visas — `account/page.tsx` |
| 54 | Paroles atjaunošanas e-pasta forma atbalsta Enter, pārlūka e-pasta validāciju, etiķeti un automātisko aizpildi. | Visas — `forgot-password/page.tsx` |
| 55 | Paroles atjaunošanas pieprasījums vairs nerāda panākumus pie HTTP kļūmes; ir termiņš, kļūdas teksts, atkārtošanas iespēja un aizsardzība pret dubultu nosūtīšanu. | Visas — `forgot-password/page.tsx` |
| 56 | Jaunā parole un tās atkārtojums tiek pārbaudīti pirms nosūtīšanas; laukiem ir garuma robežas un paroļu pārvaldnieka norādes. | Visas — `reset-password/page.tsx` |
| 57 | Bez atjaunošanas tokena nevar nosūtīt paroles maiņas pieprasījumu; skaidri parādīts nederīgas saites stāvoklis. | Visas — `reset-password/page.tsx` |
| 58 | Pēc sekmīgas paroles maiņas tokens tiek izņemts no adreses un paroles no formas stāvokļa. | Visas — `reset-password/page.tsx` |
| 59 | Rezervāciju šodienas datums un EatToGo plānotā pasūtījuma datums balstās Amsterdamas laika joslā; EatToGo nākamās nedēļas dienas etiķete vairs nav atkarīga no pārlūka laika joslas. | S, T — rezervācijas; E — pasūtījumi |
| 60 | Shah rezervāciju izvēlnē netiek piedāvātas pirmdienas un jau pagājuši šodienas laiki; pirms nosūtīšanas abās restorānu formās atkārtoti pārbauda izvēlēto laiku. | S, T — `reservations/page.tsx` |
| 61 | Rezervācijas e-pasts formā ir obligāts un pieteikumam tiek nodota izvēlētā valoda; kontaktlaukiem noteiktas saprātīgas garuma robežas. | S, T — `reservations/page.tsx` |
| 62 | Rezervācijas tūlītējs pieprasījuma aizslēgs novērš dubultklikšķa atkārtojumus; nosūtīšanas stāvoklis atbrīvojas arī kļūmes gadījumā. | S, T — `reservations/page.tsx` |
| 63 | Rezervācijas kļūda saņem fokusu, ekrānlasītāja paziņojumu un saistību ar formu. | S, T — `reservations/page.tsx` |
| 64 | Servera ievades shēmas noraida neiespējamus kalendāra datumus un laikus ārpus 00:00–23:59, neaprobežojoties ar teksta formas pārbaudi. | Visas — `validation.ts`; attiecīgās pasūtījumu/rezervāciju shēmas |
| 65 | Pievienota zīmola 404 lapa un lokalizēts kļūdas skats ar atgriešanos sākumlapā/atkārtošanu; izņemts nepamatots solījums par datu drošību kļūmes laikā. | Visas — `not-found.tsx`, `error.tsx` |
| 66 | JSON-LD izvadē aizsargāts `<`, lai apraksta saturs nevarētu pārtraukt strukturēto datu skriptu. | Visas — lapu/izkārtojumu JSON-LD |
| 67 | Izņemti nepamatotie grupas organizācijas dati un novecojušās Maison atsauces kājenēs/strukturētajos datos. | Visas — `page.tsx`; E, T — `footer.tsx` |
| 68 | EatToGo atlasīto produktu strukturētajos datos cena un valūta ievietota korektā `Offer` objektā. | E — `page.tsx` |
| 69 | Pievienots trūkstošais Shah metadatos norādītais logo: oriģināls SVG un 512×512 PNG. | S — `public/shahrestaurant.*` |
| 70 | Tandoor galerijā bojāts foto ceļš aizstāts ar esošu attēlu; precizēti divu foto apraksti atbilstoši reālajam saturam. | T — `page.tsx` |

## Pārbaudes un robežas

- Visas trīs Next.js produkcijas kompilācijas iziet, ieskaitot TypeScript pārbaudi.
- Iziet 55 mērķētas pārbaudes: datumi, laiki, pirmdiena, 15:00/22:00, pasūtījumu beigu laiks 21:30, administratora `open now`, bojāta/bloķēta krātuve, atcelšana un atbildes termiņš.
- Katrā vietnē pārlūkā pārbaudīta mobilā navigācija, valoda/tēma, attīrīts HTML, dialoga fokuss, paroļu formu kļūmes, bloķētas krātuves grozs un hidratācija. S/T pārbaudīta arī rezervāciju aizsardzība. Formu iesniegumi šajās pārbaudēs izmanto aizvietotas atbildes — netika veiktas īstas rezervācijas, pasūtījumi, maksājumi vai testa e-pastu sūtījumi.
- Katrā vietnē pārbaudīts statusa pieprasījumu nepārklāšanās režīms, slēpta cilne, bezsaistes režīms un darbības atsākšana.
- Mainīto failu ESLint salīdzinājumā nav jaunu kļūdu pret sākotnējo repozitorija versiju. Katrā vietnē šajos failos paliek divas iepriekš pastāvējušas kļūdas; pilna repozitorija tīrs ESLint rezultāts netiek apgalvots.
- Darba laiks saglabāts otrdien–svētdien 15:00–22:00, pirmdien slēgts, ar esošo administratora atvēršanas iespēju. Īpašie ārējo partneru laiki nav mainīti.
- Saglabāta vienotā datubāze, cenas, atlaides, maksājumu un e-pastu biznesa loģika. Shah pasākumu sadaļas paliek tikai administratoriem.
- Ielādes mērījumi ir atsevišķi sintētiski mobilās ierīces testi ar vienādiem tīkla/CPU ierobežojumiem; tie nav reālo apmeklētāju Core Web Vitals vai garantija rezervāciju/Google pozīciju pieaugumam.

## Pārbaudes atkārtošana

Pārbaudes skripti un mērījumi atrodas uzdevuma darba mapē `optimization-20261027`: `unit-checks.cjs`, `browser-checks.cjs`, `polling-checks.cjs`, `lint-changes.cjs`, `measure.cjs`. Pārlūka formu pārbaudēm nepieciešami lokāli produkcijas serveri 3130 (E), 3132 (T), 3135 (S); tajās ir tikai aizvietoti iesniegumi. Dzīvās lapas ielādes mērītājs izmanto tikai publisku lapu atvēršanu.
