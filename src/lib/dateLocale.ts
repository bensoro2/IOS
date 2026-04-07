import { th, enUS, ja, zhCN, ko, ru } from "date-fns/locale";
import type { Language } from "@/contexts/LanguageContext";

const dateFnsLocales: Record<Language, typeof th> = {
  th,
  en: enUS,
  ja,
  zh: zhCN,
  ko,
  ru,
};

export const getDateLocale = (language: Language) => {
  return dateFnsLocales[language] || th;
};

const intlLocaleMap: Record<Language, string> = {
  th: "th-TH",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ru: "ru-RU",
};

export const getIntlLocale = (language: Language): string => {
  return intlLocaleMap[language] || "th-TH";
};
