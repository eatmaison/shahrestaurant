type PhotoCopy = { title: string; alt: string };
type InteriorGalleryItem = {
  src: string;
  category: "interior" | "bar" | "ambiance";
  nl: PhotoCopy;
  en: PhotoCopy;
};

export const interiorPhotography = [
  {
    "src": "/brand/shah-interior-photos-v1/shah-eetzaal-teal-bank-1440.jpg",
    "category": "interior",
    "nl": {
      "title": "Eetzaal met teal bank",
      "alt": "Tealgroene bank, gedekte tafels en het ronde Shah-logo tegen een houten wand."
    },
    "en": {
      "title": "Dining room with teal banquette",
      "alt": "A teal banquette, set tables and the round Shah logo on a slatted wood wall."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-hanglampen-etes-960.jpg",
    "category": "interior",
    "nl": {
      "title": "Tafels bij het raam",
      "alt": "Rij tafels langs een gestoffeerde bank onder koperkleurige hanglampen."
    },
    "en": {
      "title": "Tables by the window",
      "alt": "A row of tables along an upholstered banquette beneath copper-coloured pendant lights."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-bar-barkrukken-960.jpg",
    "category": "bar",
    "nl": {
      "title": "De bar",
      "alt": "Donkergroene barkrukken, verlichte flessenrekken en het ronde Shah-logo naast de bar."
    },
    "en": {
      "title": "The bar",
      "alt": "Dark green stools, lit bottle shelves and the round Shah logo beside the bar."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-glazen-entree-1440.jpg",
    "category": "interior",
    "nl": {
      "title": "De glazen entree",
      "alt": "Dubbele glazen deuren met het Shah-embleem en zicht op de verlichte bar."
    },
    "en": {
      "title": "The glass entrance",
      "alt": "Double glass doors with the Shah emblem and a view of the lit bar."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-eetzaal-wandverlichting-1440.jpg",
    "category": "interior",
    "nl": {
      "title": "Eetzaal bij avondlicht",
      "alt": "Gedekte tafels en gestoffeerde banken tegen een wand met patroon en warme verlichting."
    },
    "en": {
      "title": "Dining room in warm light",
      "alt": "Set tables and upholstered banquettes against a patterned wall with warm lights."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-raamtafel-roze-stoelen-960.jpg",
    "category": "interior",
    "nl": {
      "title": "Tafel met roze stoelen",
      "alt": "Roze stoelen rond een glanzende tafel bij het raam met het Shah-logo op het glas."
    },
    "en": {
      "title": "Table with pink chairs",
      "alt": "Pink chairs around a glossy table by the window, with the Shah logo on the glass."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-bar-flessenrek-1440.jpg",
    "category": "bar",
    "nl": {
      "title": "Het verlichte flessenrek",
      "alt": "Verlichte metalen rekken met flessen en hangende glazen achter de bar."
    },
    "en": {
      "title": "The lit bottle shelves",
      "alt": "Lit metal shelves with bottles and hanging glasses behind the bar."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-zitbanken-bij-het-raam-1440.jpg",
    "category": "interior",
    "nl": {
      "title": "Zitbanken in het daglicht",
      "alt": "Tafels tussen hoge gestoffeerde banken, met daglicht uit het grote raam."
    },
    "en": {
      "title": "Window booths in daylight",
      "alt": "Tables between high upholstered booth seats, lit by the large window."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-gedekte-tafel-1440.jpg",
    "category": "interior",
    "nl": {
      "title": "Een gedekte tafel",
      "alt": "Glanzend tafelblad met een goudkleurige rand, bestek en een drankenkaart."
    },
    "en": {
      "title": "A table set for dinner",
      "alt": "A glossy tabletop with a gold-coloured edge, cutlery and a drinks menu."
    }
  },
  {
    "src": "/brand/shah-interior-photos-v1/shah-planten-vensterbank-1440.jpg",
    "category": "ambiance",
    "nl": {
      "title": "Planten bij het raam",
      "alt": "Kamerplanten en decoratieve potten op de vensterbank van het restaurant."
    },
    "en": {
      "title": "Plants by the window",
      "alt": "Houseplants and decorative pots on the restaurant windowsill."
    }
  }
] as const satisfies readonly InteriorGalleryItem[];

export const homepageInterior = {
  gallery: interiorPhotography.slice(0, 3),
  entrance: interiorPhotography[3],
  occasions: interiorPhotography[4],
  story: interiorPhotography[5],
  dining: interiorPhotography[7],
  takeaway: interiorPhotography[8],
};
