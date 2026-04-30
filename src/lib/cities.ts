export type CityId = string;

export type City = {
  id: CityId;
  name: string;
};

export const DEFAULT_CITY_ID: CityId = process.env.NEXT_PUBLIC_DEFAULT_CITY_ID ?? "bangalore";

export const KNOWN_CITIES: City[] = [
  { id: "bangalore", name: "Bangalore" },
  { id: "cochin", name: "Cochin" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "chennai", name: "Chennai" },
];

export function normalizeCityId(input: string | null | undefined): CityId {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return DEFAULT_CITY_ID;
  // keep it filesystem-safe
  return raw.replace(/[^a-z0-9_-]/g, "-");
}

