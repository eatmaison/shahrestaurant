"use client";

import { useLang } from "../providers";

/**
 * Terms & Conditions (Algemene Voorwaarden). Bilingual EN/NL, self-contained
 * content - kept out of the main translations dictionary because of its size.
 */

interface Section {
  title: string;
  body: string[];
}

const CONTENT: Record<"en" | "nl", { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Terms & Conditions",
    updated: "Last updated: 9 July 2026",
    intro:
      "These terms and conditions apply to all orders placed through eattogo.nl, operated by Eat to go, Klaprozenweg 36a, 1032 KL Amsterdam, the Netherlands. By placing an order you agree to these terms.",
    sections: [
      {
        title: "1. Orders & delivery",
        body: [
          "Orders can be placed through our website for delivery within our Amsterdam delivery area or for pickup.",
          "A minimum order value applies; the current minimum is shown during checkout. Delivery is free above the threshold shown at checkout; otherwise a delivery fee applies.",
          "Delivery times are estimates. We always do our best, but delays can occur during busy periods.",
          "Please check your delivery address and phone number carefully - we may need to contact you about your order.",
        ],
      },
      {
        title: "2. Prices & payment",
        body: [
          "All prices are in euros and include VAT (BTW).",
          "Personal orders are paid online at the time of ordering via our payment provider Mollie (iDEAL, card and other methods).",
          "Business (company) accounts may order on invoice, subject to a signed agreement. Invoices must be paid within the term stated on the invoice.",
          "We reserve the right to change prices at any time; the price shown at the time of ordering applies.",
        ],
      },
      {
        title: "3. Right of withdrawal",
        body: [
          "Under EU consumer law (Directive 2011/83/EU), the right of withdrawal does not apply to freshly prepared food and other perishable goods. Once an order has been prepared, it cannot be cancelled or returned.",
          "If your order is wrong or unsatisfactory, contact us at info@eattogo.nl or +31 20 341 2995 and we will find a fair solution.",
        ],
      },
      {
        title: "4. Loyalty points & VIP",
        body: [
          "Loyalty points are earned on paid orders and can be redeemed on future orders (1 point = €1). Points have no cash value and cannot be transferred or paid out.",
          "VIP membership grants a discount on food items as shown on the website. VIP status obtained via an uploaded physical card photo is subject to our approval.",
          "We reserve the right to adjust or discontinue the loyalty and VIP programmes; earned points remain valid for a reasonable period after any change.",
        ],
      },
      {
        title: "5. Accounts",
        body: [
          "You are responsible for keeping your account credentials confidential.",
          "We may suspend accounts that abuse the service, place fraudulent orders or violate these terms.",
        ],
      },
      {
        title: "6. Allergies & food information",
        body: [
          "If you have allergies or dietary requirements, mention them in the order note or contact us before ordering. Our kitchen handles common allergens and cross-contamination cannot be fully excluded.",
        ],
      },
      {
        title: "7. Liability",
        body: [
          "Our liability is limited to the value of the order concerned, except in cases of intent or gross negligence, and without limiting your statutory consumer rights.",
        ],
      },
      {
        title: "8. Applicable law",
        body: [
          "Dutch law applies to these terms. Disputes will be submitted to the competent court in Amsterdam, without prejudice to your rights as a consumer.",
          "EU consumers may also use the European Online Dispute Resolution platform: ec.europa.eu/consumers/odr.",
        ],
      },
    ],
  },
  nl: {
    title: "Algemene Voorwaarden",
    updated: "Laatst bijgewerkt: 9 juli 2026",
    intro:
      "Deze algemene voorwaarden zijn van toepassing op alle bestellingen via eattogo.nl, geëxploiteerd door Eat to go, Klaprozenweg 36a, 1032 KL Amsterdam, Nederland. Door een bestelling te plaatsen gaat u akkoord met deze voorwaarden.",
    sections: [
      {
        title: "1. Bestellingen & bezorging",
        body: [
          "Bestellingen kunnen via onze website worden geplaatst voor bezorging binnen ons bezorggebied in Amsterdam of voor afhalen.",
          "Er geldt een minimale bestelwaarde; het actuele minimum wordt getoond tijdens het afrekenen. Boven de getoonde drempel is bezorging gratis; anders geldt een bezorgtarief.",
          "Bezorgtijden zijn indicatief. Wij doen altijd ons best, maar tijdens drukte kan vertraging optreden.",
          "Controleer uw bezorgadres en telefoonnummer zorgvuldig - wij moeten u mogelijk kunnen bereiken over uw bestelling.",
        ],
      },
      {
        title: "2. Prijzen & betaling",
        body: [
          "Alle prijzen zijn in euro's en inclusief BTW.",
          "Particuliere bestellingen worden bij het bestellen online betaald via onze betaalprovider Mollie (iDEAL, kaart en andere methoden).",
          "Zakelijke accounts kunnen op factuur bestellen, mits een ondertekende overeenkomst. Facturen dienen binnen de op de factuur vermelde termijn te worden voldaan.",
          "Wij behouden ons het recht voor prijzen te wijzigen; de prijs op het moment van bestellen is van toepassing.",
        ],
      },
      {
        title: "3. Herroepingsrecht",
        body: [
          "Op grond van het Europese consumentenrecht (Richtlijn 2011/83/EU) geldt het herroepingsrecht niet voor vers bereide maaltijden en andere bederfelijke goederen. Zodra een bestelling is bereid, kan deze niet worden geannuleerd of geretourneerd.",
          "Is uw bestelling onjuist of niet naar wens? Neem contact op via info@eattogo.nl of +31 20 341 2995 en wij zoeken een passende oplossing.",
        ],
      },
      {
        title: "4. Spaarpunten & VIP",
        body: [
          "Spaarpunten worden verdiend op betaalde bestellingen en kunnen worden ingewisseld bij volgende bestellingen (1 punt = €1). Punten hebben geen contante waarde en zijn niet overdraagbaar of uitbetaalbaar.",
          "VIP-lidmaatschap geeft korting op etenswaren zoals vermeld op de website. VIP-status via een geüploade foto van een fysieke kaart is onder voorbehoud van onze goedkeuring.",
          "Wij behouden ons het recht voor het spaar- en VIP-programma aan te passen of te beëindigen; verdiende punten blijven na een wijziging gedurende een redelijke periode geldig.",
        ],
      },
      {
        title: "5. Accounts",
        body: [
          "U bent verantwoordelijk voor het vertrouwelijk houden van uw inloggegevens.",
          "Wij kunnen accounts opschorten die misbruik maken van de dienst, frauduleuze bestellingen plaatsen of deze voorwaarden schenden.",
        ],
      },
      {
        title: "6. Allergieën & voedselinformatie",
        body: [
          "Heeft u allergieën of dieetwensen, vermeld dit dan in de bestelnotitie of neem vóór het bestellen contact met ons op. In onze keuken worden gangbare allergenen verwerkt en kruisbesmetting kan niet volledig worden uitgesloten.",
        ],
      },
      {
        title: "7. Aansprakelijkheid",
        body: [
          "Onze aansprakelijkheid is beperkt tot de waarde van de betreffende bestelling, behoudens opzet of grove nalatigheid, en onverminderd uw wettelijke rechten als consument.",
        ],
      },
      {
        title: "8. Toepasselijk recht",
        body: [
          "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter te Amsterdam, onverminderd uw rechten als consument.",
          "EU-consumenten kunnen ook gebruikmaken van het Europese platform voor onlinegeschillenbeslechting: ec.europa.eu/consumers/odr.",
        ],
      },
    ],
  },
};

export default function TermsPage() {
  const { lang } = useLang();
  const c = CONTENT[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">{c.title}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{c.updated}</p>
      <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">{c.intro}</p>
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
