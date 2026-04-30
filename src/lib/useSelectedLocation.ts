"use client";

import { useEffect, useMemo, useState } from "react";

const KEY = "cityquest.selectedLocationSlug.v1";
const DEFAULT_LOCATION = "bangalore";

export function useSelectedLocation() {
  const [locationSlug, setLocationSlug] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCATION;
    try {
      const saved = window.localStorage.getItem(KEY);
      return (saved ?? DEFAULT_LOCATION).trim() || DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, (locationSlug ?? DEFAULT_LOCATION).trim() || DEFAULT_LOCATION);
    } catch {}
  }, [locationSlug]);

  const location = useMemo(() => ({ slug: (locationSlug ?? DEFAULT_LOCATION).trim() || DEFAULT_LOCATION }), [locationSlug]);

  return { locationSlug: location.slug, setLocationSlug, location };
}

