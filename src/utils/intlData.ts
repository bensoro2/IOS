/**
 * Uses the browser's built-in Intl API to dynamically get all countries and languages.
 * No extra library needed — supports all modern browsers.
 */

// ─── Locale map: app language code → BCP-47 locale ────────────────────────────
export const LOCALE_MAP: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ru: "ru-RU",
  fr: "fr-FR",
  de: "de-DE",
};

export const getLocale = (language: string): string =>
  LOCALE_MAP[language] ?? "en-US";

// ─── Flag emoji from ISO 3166-1 alpha-2 code ──────────────────────────────────
export const getFlagEmoji = (code: string): string =>
  code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

// ─── All ISO 3166-1 alpha-2 country codes (~249 countries) ─────────────────────
const ISO_COUNTRY_CODES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AR","AS","AT","AU","AW","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BM","BN","BO","BR","BS","BT","BW","BY","BZ",
  "CA","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GH","GL","GM","GN","GQ","GR","GT","GU","GW","GY",
  "HK","HN","HR","HT","HU",
  "ID","IE","IL","IN","IQ","IR","IS","IT",
  "JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MO","MR","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NG","NI","NL","NO","NP","NR","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PR","PS","PT","PW","PY",
  "QA",
  "RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WS",
  "YE",
  "ZA","ZM","ZW",
];

export interface CountryOption {
  code: string;
  flag: string;
  name: string;
}

/**
 * Returns all countries with names localized to the given app language.
 * Sorted alphabetically by the localized name.
 */
export const getAllCountries = (language: string): CountryOption[] => {
  const locale = getLocale(language);
  let displayNames: Intl.DisplayNames;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    displayNames = new Intl.DisplayNames(["en-US"], { type: "region" });
  }

  return ISO_COUNTRY_CODES
    .map((code) => ({
      code,
      flag: getFlagEmoji(code),
      name: displayNames.of(code) ?? code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
};

/**
 * Returns a single country's localized name.
 */
export const getLocalizedCountryName = (code: string, language: string): string => {
  const locale = getLocale(language);
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
};

// ─── Language support ─────────────────────────────────────────────────────────
export interface LanguageOption {
  code: string;
  flag: string;
  /** Native name of the language (shown in the language itself) */
  nativeName: string;
  /** Whether this language has full UI translations */
  supported: boolean;
}

/**
 * Map language code → representative country flag
 */
const LANG_FLAG: Record<string, string> = {
  af: "🇿🇦", am: "🇪🇹", ar: "🇸🇦", az: "🇦🇿", be: "🇧🇾", bg: "🇧🇬",
  bn: "🇧🇩", bs: "🇧🇦", ca: "🇪🇸", cs: "🇨🇿", cy: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", da: "🇩🇰",
  de: "🇩🇪", el: "🇬🇷", en: "🇺🇸", eo: "🌍", es: "🇪🇸", et: "🇪🇪",
  eu: "🇪🇸", fa: "🇮🇷", fi: "🇫🇮", fr: "🇫🇷", ga: "🇮🇪", gl: "🇪🇸",
  gu: "🇮🇳", he: "🇮🇱", hi: "🇮🇳", hr: "🇭🇷", hu: "🇭🇺", hy: "🇦🇲",
  id: "🇮🇩", is: "🇮🇸", it: "🇮🇹", ja: "🇯🇵", ka: "🇬🇪", kk: "🇰🇿",
  km: "🇰🇭", kn: "🇮🇳", ko: "🇰🇷", ku: "🇮🇶", ky: "🇰🇬", lo: "🇱🇦",
  lt: "🇱🇹", lv: "🇱🇻", mk: "🇲🇰", ml: "🇮🇳", mn: "🇲🇳", mr: "🇮🇳",
  ms: "🇲🇾", mt: "🇲🇹", my: "🇲🇲", ne: "🇳🇵", nl: "🇳🇱", no: "🇳🇴",
  pa: "🇮🇳", pl: "🇵🇱", ps: "🇦🇫", pt: "🇵🇹", ro: "🇷🇴", ru: "🇷🇺",
  si: "🇱🇰", sk: "🇸🇰", sl: "🇸🇮", sn: "🇿🇼", so: "🇸🇴", sq: "🇦🇱",
  sr: "🇷🇸", sv: "🇸🇪", sw: "🇰🇪", ta: "🇮🇳", te: "🇮🇳", tg: "🇹🇯",
  th: "🇹🇭", tl: "🇵🇭", tr: "🇹🇷", uk: "🇺🇦", ur: "🇵🇰", uz: "🇺🇿",
  vi: "🇻🇳", xh: "🇿🇦", yi: "🇮🇱", yo: "🇳🇬", zh: "🇨🇳", zu: "🇿🇦",
};

/** ISO 639-1 language codes — all common world languages */
const ISO_LANGUAGE_CODES = [
  "af","am","ar","az","be","bg","bn","bs","ca","cs","cy","da","de",
  "el","en","eo","es","et","eu","fa","fi","fr","ga","gl","gu",
  "he","hi","hr","hu","hy","id","is","it","ja","ka","kk","km",
  "kn","ko","ku","ky","lo","lt","lv","mk","ml","mn","mr","ms",
  "mt","my","ne","nl","no","pa","pl","ps","pt","ro","ru","si",
  "sk","sl","sn","so","sq","sr","sv","sw","ta","te","tg","th",
  "tl","tr","uk","ur","uz","vi","xh","yi","yo","zh","zu",
];

/** Language codes that have full UI translations in the app */
const FULLY_SUPPORTED = new Set(["th","en","ja","zh","ko","ru"]);

/**
 * Returns all world languages with their native names.
 * Languages with full translations are marked as supported.
 * Sorted: supported languages first, then alphabetically by native name.
 */
export const getAllLanguages = (): LanguageOption[] => {
  const result: LanguageOption[] = [];

  for (const code of ISO_LANGUAGE_CODES) {
    try {
      const dn = new Intl.DisplayNames([code], { type: "language" });
      const raw = dn.of(code) ?? code;
      // Capitalize first letter
      const nativeName = raw.charAt(0).toUpperCase() + raw.slice(1);
      result.push({
        code,
        flag: LANG_FLAG[code] ?? "🌐",
        nativeName,
        supported: FULLY_SUPPORTED.has(code),
      });
    } catch {
      result.push({
        code,
        flag: LANG_FLAG[code] ?? "🌐",
        nativeName: code,
        supported: FULLY_SUPPORTED.has(code),
      });
    }
  }

  // Supported languages first, then rest alphabetically
  return result.sort((a, b) => {
    if (a.supported !== b.supported) return a.supported ? -1 : 1;
    return a.nativeName.localeCompare(b.nativeName);
  });
};

/** Languages the app UI actually supports (full translations) */
export const SUPPORTED_APP_LANGUAGES: LanguageOption[] = [
  { code: "th", flag: "🇹🇭", nativeName: "ภาษาไทย", supported: true },
  { code: "en", flag: "🇺🇸", nativeName: "English", supported: true },
  { code: "ja", flag: "🇯🇵", nativeName: "日本語", supported: true },
  { code: "zh", flag: "🇨🇳", nativeName: "中文", supported: true },
  { code: "ko", flag: "🇰🇷", nativeName: "한국어", supported: true },
  { code: "ru", flag: "🇷🇺", nativeName: "Русский", supported: true },
];
