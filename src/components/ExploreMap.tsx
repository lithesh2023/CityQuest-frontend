"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useSession } from "next-auth/react";
import { useSelectedLocation } from "@/lib/useSelectedLocation";
import { getMyMapCompletions, type MapCompletionItem } from "@/lib/api/cityquest";

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0]!, 15);
      return;
    }
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [48, 48], maxZoom: 15 });
  }, [map, points]);
  return null;
}

type ExploreMapProps = {
  variant?: "card" | "full";
};

export function ExploreMap({ variant = "card" }: ExploreMapProps) {
  const { data: session } = useSession();
  const { locationSlug } = useSelectedLocation();
  const accessToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;

  const [items, setItems] = useState<MapCompletionItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setItems([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const data = await getMyMapCompletions(locationSlug, accessToken);
        if (!cancelled) {
          setItems(data.items ?? []);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoadError("Could not load your completed places.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, locationSlug]);

  const points = useMemo(
    () => items.map((i) => [i.lat, i.lng] as [number, number]),
    [items],
  );

  const mapCenter = useMemo((): [number, number] => {
    if (points.length === 0) return DEFAULT_CENTER;
    const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
    const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
    return [lat, lng];
  }, [points]);

  const wrapperClass =
    variant === "full"
      ? "relative h-full w-full overflow-hidden bg-white/5"
      : "relative h-72 w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-black/8";

  return (
    <div className={wrapperClass}>
      <MapContainer
        center={mapCenter}
        zoom={points.length ? 13 : 12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.length > 0 ? <FitBounds points={points} /> : null}

        {items.map((c) => (
          <CircleMarker
            key={c.submission_id}
            center={[c.lat, c.lng]}
            radius={9}
            pathOptions={{
              color: "#5b21b6",
              weight: 2,
              fillColor: "#7c3aed",
              fillOpacity: 0.88,
            }}
          >
            <Popup>
              <div className="min-w-[10rem] text-sm">
                <div className="font-semibold">{c.mission_title}</div>
                <div className="mt-1 text-xs text-neutral-600">
                  {c.journey_title} · Level {c.level_order}
                </div>
                {c.mission_address ? (
                  <div className="mt-1 text-xs text-neutral-500">{c.mission_address}</div>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-black/10">
          <span className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-black/10 shadow-sm">
            Loading map…
          </span>
        </div>
      ) : null}

      {!loading && loadError ? (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] rounded-2xl bg-amber-500/15 px-3 py-2 text-center text-xs font-medium text-amber-950 ring-1 ring-amber-500/25">
          {loadError}
        </div>
      ) : null}

      {!loading && !loadError && items.length === 0 && accessToken ? (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] rounded-2xl bg-black/55 px-3 py-2 text-center text-xs font-medium text-white backdrop-blur-sm">
          Complete missions with photo + location to see them on your map.
        </div>
      ) : null}
    </div>
  );
}
