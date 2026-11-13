"use client";

import { useLang } from "../providers";
import { useRef } from "react";
import { useCinematicPageReady } from "../lib/useCinematicPageReady";
import "../cinematic.css";

/**
 * Privacy Policy (GDPR / AVG). Bilingual EN/NL, self-contained content -
 * kept out of the main translations dictionary because of its size.
 */

interface Section {
  title: string;
  body: string[];
}

const CONTENT: Record<"en" | "nl", { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 13 November 2026",
    intro:
      "Shah Restaurant, located at Klaprozenweg 36a, 1032 KL Amsterdam, the Netherlands (\"we\", \"us\"), is responsible for the processing of personal data as described in this privacy policy. We process your data in accordance with the General Data Protection Regulation (GDPR / AVG). Contact: info@shahrestaurant.nl, +31 20 341 2995.",
    sections: [
      {
        title: "1. What data we collect",
        body: [
          "Account data: name, e-mail address, phone number and a securely hashed password when you create an account.",
          "Business data: BTW (VAT) and KvK numbers when you register a company account.",
          "Order data: delivery name, address, postcode, phone number, order contents, optional delivery notes and order history.",
          "Reservation data: name, e-mail address, phone number, date, time, party size and any special requests when you reserve a table.",
          "Event ticket data: first and last name, e-mail address, phone number, event and date, ticket quantity, price, payment status and booking/payment references. We use these to fulfil your booking, manage admission and send transactional confirmations or booking updates (performance of a contract). Financial records follow our order and invoice retention policy; guest contact data is retained only as needed for the booking and applicable obligations.",
          "VIP card requests: a photo of your physical VIP card, if you choose to upload one. This photo is stored in our own database and is not shared with third parties.",
          "Reviews: your rating, review text and display name.",
        ],
      },
      {
        title: "2. Why we process your data (legal basis)",
        body: [
          "To process and deliver your orders (performance of a contract).",
          "To manage your account, loyalty points and VIP membership (performance of a contract).",
          "To send transactional e-mails such as order confirmations, e-mail verification and password resets (performance of a contract / legitimate interest).",
          "To comply with legal obligations, such as tax and bookkeeping requirements (legal obligation).",
          "We do not use your data for marketing without your consent, and we do not sell your data.",
        ],
      },
      {
        title: "3. Payments",
        body: [
          "Online payments are processed by Mollie B.V., a Dutch licensed payment service provider. When you pay online, Mollie processes the data required to complete the payment under its own privacy policy. We never see or store your full payment details (such as card numbers).",
        ],
      },
      {
        title: "4. Where your data is stored",
        body: [
          "Your data is stored in our own database. Uploaded images (such as VIP card photos) are stored in our own database as well - we do not use external image-hosting services.",
          "E-mails are sent via our own e-mail provider solely for transactional purposes.",
        ],
      },
      {
        title: "5. How long we keep your data",
        body: [
          "Account data: for as long as your account exists.",
          "Order and invoice data: 7 years, as required by Dutch tax law (fiscale bewaarplicht).",
          "VIP card photos: until your request has been reviewed and reasonably thereafter for administration.",
          "You may request deletion of your account at any time (see section 7).",
        ],
      },
      {
        title: "6. Cookies",
        body: [
          "Required cookies and storage support your login session, shopping cart, language/theme preferences and a browser identifier used to link your own orders and reservations. Administrative activity timestamps describe observed requests, not verified people or continuous attention.",
          "For event bookings, session storage keeps a private access token so you can return to your confirmation in the same browser tab. Keep your confirmation link private.",
          "Optional visit analytics starts only after you choose Allow visit analytics. An earlier cookie-notice acknowledgement does not grant this permission. We record only the referring domain (not its URL path/query), restricted campaign source/medium/name values, a known public page path, observation timestamps and coarse browser/user-agent signals. We do not store IP addresses, raw user agents, keystrokes, advertising identifiers or browser fingerprints in this analytics record.",
          "Analytics is tied to this browser identifier and, while signed in, your account. Possible automation and interaction labels are uncertain signals, not proof of a bot, a person or a particular identity. Sources are first observed after permission; missing historical information stays unknown. Observations expire after 30 days and are excluded after expiry; expired records are removed by application cleanup and the database maintenance job. Your permission preference lasts up to 180 days.",
          "You can change or withdraw permission through Cookie preferences in the footer. Necessary only stops optional collection and requests removal of this browser's analytics records. We do not use advertising trackers or send these observations to a third-party analytics service.",
        ],
      },
      {
        title: "7. Your rights",
        body: [
          "Under the GDPR you have the right to access, rectify, erase, restrict and port your personal data, and the right to object to processing.",
          "To exercise these rights, e-mail us at info@shahrestaurant.nl. We will respond within one month.",
          "You also have the right to lodge a complaint with the Dutch supervisory authority: Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).",
        ],
      },
      {
        title: "8. Security",
        body: [
          "We take appropriate technical and organisational measures to protect your data, including encrypted connections (HTTPS), hashed passwords and rate-limited access to our services.",
        ],
      },
      {
        title: "9. Changes",
        body: [
          "We may update this privacy policy from time to time. The most recent version is always available on this page.",
        ],
      },
    ],
  },
  nl: {
    title: "Privacybeleid",
    updated: "Laatst bijgewerkt: 13 november 2026",
    intro:
      "Shah Restaurant, gevestigd aan Klaprozenweg 36a, 1032 KL Amsterdam, Nederland (\"wij\", \"ons\"), is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in dit privacybeleid. Wij verwerken uw gegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG). Contact: info@shahrestaurant.nl, +31 20 341 2995.",
    sections: [
      {
        title: "1. Welke gegevens wij verzamelen",
        body: [
          "Accountgegevens: naam, e-mailadres, telefoonnummer en een veilig gehasht wachtwoord wanneer u een account aanmaakt.",
          "Bedrijfsgegevens: BTW- en KvK-nummer wanneer u een zakelijk account registreert.",
          "Bestelgegevens: naam, bezorgadres, postcode, telefoonnummer, inhoud van de bestelling, eventuele bezorgnotities en bestelgeschiedenis.",
          "Reserveringsgegevens: naam, e-mailadres, telefoonnummer, datum, tijd, aantal gasten en eventuele speciale verzoeken bij een tafelreservering.",
          "Evenementtickets: voor- en achternaam, e-mailadres, telefoonnummer, evenement en datum, aantal tickets, prijs, betaalstatus en boekings-/betaalreferenties. Wij gebruiken deze voor uw boeking, toegangsbeheer en transactionele bevestigingen of boekingsupdates (uitvoering van een overeenkomst). Financiele gegevens volgen ons bewaarbeleid voor bestellingen en facturen; contactgegevens bewaren wij alleen zolang nodig voor de boeking en toepasselijke verplichtingen.",
          "VIP-kaartverzoeken: een foto van uw fysieke VIP-kaart, indien u deze uploadt. Deze foto wordt in onze eigen database opgeslagen en niet gedeeld met derden.",
          "Beoordelingen: uw waardering, tekst en weergavenaam.",
        ],
      },
      {
        title: "2. Waarom wij uw gegevens verwerken (grondslag)",
        body: [
          "Om uw bestellingen te verwerken en te bezorgen (uitvoering van een overeenkomst).",
          "Om uw account, spaarpunten en VIP-lidmaatschap te beheren (uitvoering van een overeenkomst).",
          "Om transactionele e-mails te versturen zoals orderbevestigingen, e-mailverificatie en wachtwoordherstel (uitvoering van een overeenkomst / gerechtvaardigd belang).",
          "Om te voldoen aan wettelijke verplichtingen, zoals fiscale en administratieve eisen (wettelijke verplichting).",
          "Wij gebruiken uw gegevens niet voor marketing zonder uw toestemming en verkopen uw gegevens niet.",
        ],
      },
      {
        title: "3. Betalingen",
        body: [
          "Online betalingen worden verwerkt door Mollie B.V., een Nederlandse vergunninghoudende betaaldienstverlener. Wanneer u online betaalt, verwerkt Mollie de daarvoor benodigde gegevens onder haar eigen privacybeleid. Wij zien of bewaren nooit uw volledige betaalgegevens (zoals kaartnummers).",
        ],
      },
      {
        title: "4. Waar uw gegevens worden opgeslagen",
        body: [
          "Uw gegevens worden opgeslagen in onze eigen database. Geüploade afbeeldingen (zoals VIP-kaartfoto's) worden eveneens in onze eigen database opgeslagen - wij gebruiken geen externe beeldhostingdiensten.",
          "E-mails worden uitsluitend voor transactionele doeleinden verzonden via onze eigen e-mailprovider.",
        ],
      },
      {
        title: "5. Hoe lang wij uw gegevens bewaren",
        body: [
          "Accountgegevens: zolang uw account bestaat.",
          "Bestel- en factuurgegevens: 7 jaar, conform de fiscale bewaarplicht.",
          "VIP-kaartfoto's: totdat uw verzoek is beoordeeld en daarna redelijkerwijs voor administratie.",
          "U kunt op elk moment verwijdering van uw account aanvragen (zie punt 7).",
        ],
      },
      {
        title: "6. Cookies",
        body: [
          "Noodzakelijke cookies en opslag ondersteunen uw inlogsessie, winkelwagen, taal-/themavoorkeuren en een browser-ID om uw eigen bestellingen en reserveringen te koppelen. Administratieve activiteitstijden beschrijven waargenomen aanvragen, geen geverifieerde personen of voortdurende aandacht.",
          "Optionele bezoekanalyse start alleen nadat u Bezoekanalyse toestaan kiest. Een eerdere bevestiging van de cookiemelding geeft die toestemming niet. Wij registreren alleen het verwijzende domein (zonder URL-pad/query), beperkte campagnebron/medium/naam, een bekend openbaar paginapad, waarnemingstijden en globale browser-/user-agentsignalen. In dit analyserecord bewaren wij geen IP-adressen, ruwe user agents, toetsaanslagen, advertentie-ID's of browserfingerprints.",
          "De analyse is gekoppeld aan deze browser-ID en, tijdens inloggen, uw account. Mogelijke automatisering en interactie zijn onzekere signalen, geen bewijs van een bot, persoon of identiteit. Bronnen worden pas na toestemming waargenomen; ontbrekende historie blijft onbekend. Waarnemingen verlopen na 30 dagen en worden daarna niet meer getoond; verlopen records worden via applicatie-opruiming en databaseonderhoud verwijderd. Uw toestemmingsvoorkeur blijft maximaal 180 dagen bewaard.",
          "Via Cookievoorkeuren in de footer kunt u toestemming wijzigen of intrekken. Alleen noodzakelijk stopt optionele registratie en vraagt verwijdering van de analyserecords van deze browser aan. Wij gebruiken geen advertentietrackers en sturen deze waarnemingen niet naar een externe analysedienst.",
        ],
      },
      {
        title: "7. Uw rechten",
        body: [
          "Op grond van de AVG heeft u recht op inzage, rectificatie, verwijdering, beperking en overdraagbaarheid van uw persoonsgegevens, en het recht om bezwaar te maken tegen verwerking.",
          "Om deze rechten uit te oefenen kunt u mailen naar info@shahrestaurant.nl. Wij reageren binnen één maand.",
          "U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).",
        ],
      },
      {
        title: "8. Beveiliging",
        body: [
          "Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen, waaronder versleutelde verbindingen (HTTPS), gehashte wachtwoorden en snelheidsbeperkte toegang tot onze diensten.",
        ],
      },
      {
        title: "9. Wijzigingen",
        body: [
          "Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De meest recente versie vindt u altijd op deze pagina.",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const cinematicRootRef = useRef<HTMLDivElement>(null);
  useCinematicPageReady(cinematicRootRef, "privacy");
  const { lang } = useLang();
  const c = CONTENT[lang];

  return (
    <div ref={cinematicRootRef} className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(217,126,38,0.10),transparent_70%)]" />
      <span className="lux-overline relative inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <span className="ornament-gem" aria-hidden /> Shah Restaurant
      </span>
      <h1 className="font-display relative mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{c.title}</h1>
      <p className="relative mt-2 text-sm text-slate-600 dark:text-slate-300">{c.updated}</p>
      <p className="relative mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">{c.intro}</p>
      {c.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h2>
          <ul className="mt-3 space-y-2">
            {s.body.map((p, i) => (
              <li key={i} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {p}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
