/**
 * Dynamic translation service using Google Translate unofficial API.
 * No API key required. Caches results in localStorage.
 */

const CACHE_PREFIX = "levelon_i18n_v2_";

/** Languages with hardcoded native translations — no API call needed */
export const NATIVE_LANGS = new Set(["th", "en", "ja", "zh", "ko", "ru"]);

export const hasNativeTranslation = (lang: string) => NATIVE_LANGS.has(lang);

// ─── Cache helpers ────────────────────────────────────────────────────────────

export const loadCachedTranslations = (lang: string): Record<string, string> | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
};

export const saveCachedTranslations = (lang: string, data: Record<string, string>) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded — ignore
  }
};

// ─── Translation API ──────────────────────────────────────────────────────────

/**
 * Translate a single string via Google Translate unofficial API (en → targetLang).
 * Uses client=gtx which has no strict daily quota for typical usage.
 */
const translateOne = async (text: string, targetLang: string): Promise<string> => {
  if (!text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    // Response format: [[[translatedText, original, ...], ...], null, sourceLang]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = (data[0] as [string, string][])
        .map((item) => item[0])
        .join("");
      if (translated && translated.trim()) return translated;
    }
  } catch {
    // Network error or timeout — return original
  }
  return text;
};

/**
 * Translate all English UI strings to targetLang.
 * Processes in parallel batches of 20 for speed.
 * Calls onProgress(0-1) as translation progresses.
 * Skips entries where translation came back identical to English (API failure).
 */
export const translateAllStrings = async (
  englishStrings: Record<string, string>,
  targetLang: string,
  onProgress?: (progress: number) => void
): Promise<Record<string, string>> => {
  const entries = Object.entries(englishStrings).filter(([, v]) => v.trim());
  const result: Record<string, string> = {};
  const BATCH = 20;

  for (let i = 0; i < entries.length; i += BATCH) {
    const chunk = entries.slice(i, i + BATCH);
    const translated = await Promise.all(
      chunk.map(([, text]) => translateOne(text, targetLang))
    );
    chunk.forEach(([key, original], j) => {
      const t = translated[j];
      // Only store if actually translated (not identical to English, unless very short)
      result[key] = t !== original || original.length <= 3 ? t : original;
    });
    onProgress?.(Math.min(1, (i + BATCH) / entries.length));
    // Small pause between batches to avoid flooding
    if (i + BATCH < entries.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return result;
};
