"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CITY_ID, KNOWN_CITIES, normalizeCityId } from "@/lib/cities";

const KEY = "cityquest.selectedCityId.v1";

export function useSelectedCity() {
  const [cityId, setCityId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CITY_ID;
    try {
      const saved = window.localStorage.getItem(KEY);
      return saved ? normalizeCityId(saved) : DEFAULT_CITY_ID;
    } catch {
      return DEFAULT_CITY_ID;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, normalizeCityId(cityId));
    } catch {}
  }, [cityId]);

  const city = useMemo(() => {
    const normalized = normalizeCityId(cityId);
    return KNOWN_CITIES.find((c) => c.id === normalized) ?? { id: normalized, name: normalized };
  }, [cityId]);

  return { cityId: normalizeCityId(cityId), setCityId, city };
}

