"use client";

import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

// Ensure marker icons work with Next/Webpack by using explicit URLs.
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

type ExploreMapProps = {
  variant?: "card" | "full";
};

export function ExploreMap({ variant = "card" }: ExploreMapProps) {
  const center: [number, number] = [12.9716, 77.5946]; // Bengaluru
  const markers: Array<{ pos: [number, number]; label: string }> = [
    { pos: [13.035, 77.597], label: "Hebbal" },
    { pos: [13.007, 77.565], label: "Malleshwaram" },
    { pos: [12.966, 77.611], label: "Indiranagar" },
    { pos: [12.935, 77.614], label: "Koramangala" },
    { pos: [12.912, 77.644], label: "HSR Layout" },
    { pos: [12.93, 77.58], label: "Jayanagar" },
  ];

  const wrapperClass =
    variant === "full"
      ? "relative h-full w-full overflow-hidden bg-white/5"
      : "relative h-72 w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-black/8";

  return (
    <div className={wrapperClass}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={4200}
          pathOptions={{
            color: "#6d28d9",
            weight: 2,
            opacity: 0.45,
            fillColor: "#6d28d9",
            fillOpacity: 0.12,
          }}
        />

        {markers.map((m) => (
          <Marker key={m.label} position={m.pos}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

