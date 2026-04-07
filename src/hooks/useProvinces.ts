import { useState, useEffect } from "react";
import { getCountryByCode, getProvincesForCountry } from "@/constants/countryProvinces";

const CACHE_PREFIX = "regions_v1_";

async function fetchProvincesFromAPI(countryCode: string): Promise<string[]> {
  const cached = localStorage.getItem(CACHE_PREFIX + countryCode);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* ignore */ }
  }

  // Get English country name from the browser's Intl API
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countryName = displayNames.of(countryCode);
  if (!countryName) return [];

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data.error || !data.data?.states?.length) return [];
    const states: string[] = data.data.states.map((s: { name: string }) => s.name);
    localStorage.setItem(CACHE_PREFIX + countryCode, JSON.stringify(states));
    return states;
  } catch {
    return [];
  }
}

/**
 * Returns provinces/states for the given country code.
 * - Hardcoded 6 countries (TH, JP, KR, CN, GB, RU): instant, offline
 * - All other countries: fetched from CountriesNow API + cached in localStorage
 */
export function useProvinces(countryCode: string) {
  const isHardcoded = !!getCountryByCode(countryCode);

  const [provinces, setProvinces] = useState<string[]>(() => {
    if (isHardcoded) return getProvincesForCountry(countryCode);
    const cached = localStorage.getItem(CACHE_PREFIX + countryCode);
    if (cached) { try { return JSON.parse(cached); } catch { /* ignore */ } }
    return [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isHardcoded) {
      setProvinces(getProvincesForCountry(countryCode));
      return;
    }
    const cached = localStorage.getItem(CACHE_PREFIX + countryCode);
    if (cached) {
      try { setProvinces(JSON.parse(cached)); return; } catch { /* ignore */ }
    }
    setLoading(true);
    fetchProvincesFromAPI(countryCode).then((result) => {
      setProvinces(result);
      setLoading(false);
    });
  }, [countryCode, isHardcoded]);

  return { provinces, loading, isDynamic: !isHardcoded };
}
