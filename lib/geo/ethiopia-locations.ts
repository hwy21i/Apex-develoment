export interface CountryOption {
  _id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
}

export interface RegionOption {
  _id: string;
  name: string;
  regionCode?: string;
}

export interface CityOption {
  _id: string;
  name: string;
  cityCode?: string;
}

export interface OfflineRegionData {
  _id: string;
  name: string;
  regionCode: string;
  cities: CityOption[];
}

export const DEFAULT_OFFLINE_COUNTRIES: CountryOption[] = [
  {
    _id: "loc-country-eth",
    name: "Ethiopia",
    countryCode: "ETH",
    currencyCode: "ETB",
  },
];

export const OFFLINE_ETHIOPIAN_REGIONS: OfflineRegionData[] = [
  {
    _id: "loc-reg-aa",
    name: "Addis Ababa",
    regionCode: "AA",
    cities: [
      { _id: "loc-ct-aa-bole", name: "Bole Sub-City", cityCode: "BOLE" },
      { _id: "loc-ct-aa-kirkos", name: "Kirkos Sub-City", cityCode: "KIRKOS" },
      { _id: "loc-ct-aa-yeka", name: "Yeka Sub-City", cityCode: "YEKA" },
      { _id: "loc-ct-aa-arada", name: "Arada Sub-City", cityCode: "ARADA" },
      { _id: "loc-ct-aa-lideta", name: "Lideta Sub-City", cityCode: "LIDETA" },
      { _id: "loc-ct-aa-addisketema", name: "Addis Ketema Sub-City", cityCode: "KETEMA" },
      { _id: "loc-ct-aa-gullele", name: "Gullele Sub-City", cityCode: "GULLELE" },
      { _id: "loc-ct-aa-kolfe", name: "Kolfe Keranio Sub-City", cityCode: "KOLFE" },
      { _id: "loc-ct-aa-kality", name: "Akaki Kality Sub-City", cityCode: "KALITY" },
      { _id: "loc-ct-aa-nifassilk", name: "Nifas Silk-Lafto Sub-City", cityCode: "LAFTO" },
      { _id: "loc-ct-aa-lemikura", name: "Lemi Kura Sub-City", cityCode: "LEMI" },
    ],
  },
  {
    _id: "loc-reg-or",
    name: "Oromia",
    regionCode: "OR",
    cities: [
      { _id: "loc-ct-or-adama", name: "Adama (Nazret)", cityCode: "ADAMA" },
      { _id: "loc-ct-or-bishoftu", name: "Bishoftu (Debre Zeit)", cityCode: "BSH" },
      { _id: "loc-ct-or-modjo", name: "Modjo (Dry Port Hub)", cityCode: "MDJ" },
      { _id: "loc-ct-or-jimma", name: "Jimma", cityCode: "JMA" },
      { _id: "loc-ct-or-shashemene", name: "Shashemene", cityCode: "SHASH" },
      { _id: "loc-ct-or-sebeta", name: "Sebeta", cityCode: "SEB" },
      { _id: "loc-ct-or-burayu", name: "Burayu", cityCode: "BRY" },
    ],
  },
  {
    _id: "loc-reg-am",
    name: "Amhara",
    regionCode: "AM",
    cities: [
      { _id: "loc-ct-am-bahirdar", name: "Bahir Dar", cityCode: "BHR" },
      { _id: "loc-ct-am-gondar", name: "Gondar", cityCode: "GDR" },
      { _id: "loc-ct-am-dessie", name: "Dessie", cityCode: "DES" },
      { _id: "loc-ct-am-kombolcha", name: "Kombolcha", cityCode: "KOM" },
      { _id: "loc-ct-am-debrebirhan", name: "Debre Birhan", cityCode: "DBR" },
    ],
  },
  {
    _id: "loc-reg-tg",
    name: "Tigray",
    regionCode: "TG",
    cities: [
      { _id: "loc-ct-tg-mekelle", name: "Mekelle", cityCode: "MEK" },
      { _id: "loc-ct-tg-adigrat", name: "Adigrat", cityCode: "ADG" },
      { _id: "loc-ct-tg-shire", name: "Shire Endaselassie", cityCode: "SHR" },
      { _id: "loc-ct-tg-axum", name: "Axum", cityCode: "AXM" },
    ],
  },
  {
    _id: "loc-reg-sd",
    name: "Sidama",
    regionCode: "SD",
    cities: [
      { _id: "loc-ct-sd-hawassa", name: "Hawassa", cityCode: "HAW" },
      { _id: "loc-ct-sd-yirgalem", name: "Yirgalem", cityCode: "YRG" },
      { _id: "loc-ct-sd-aleta", name: "Aleta Wendo", cityCode: "ALT" },
    ],
  },
  {
    _id: "loc-reg-dd",
    name: "Dire Dawa",
    regionCode: "DD",
    cities: [
      { _id: "loc-ct-dd-diredawa", name: "Dire Dawa City", cityCode: "DIR" },
      { _id: "loc-ct-dd-melka", name: "Melka Jebdu", cityCode: "MLK" },
    ],
  },
  {
    _id: "loc-reg-sm",
    name: "Somali",
    regionCode: "SM",
    cities: [
      { _id: "loc-ct-sm-jigjiga", name: "Jigjiga", cityCode: "JIG" },
      { _id: "loc-ct-sm-degehabur", name: "Degehabur", cityCode: "DGB" },
      { _id: "loc-ct-sm-gode", name: "Gode", cityCode: "GOD" },
      { _id: "loc-ct-sm-kebridahar", name: "Kebri Dahar", cityCode: "KBD" },
    ],
  },
];

