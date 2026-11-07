"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import type { Coordinates } from "@/types/location";

type Point = { latitude: number; longitude: number };

const tileSources = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
];

function FitRoute({ origin, destination, route }: { origin: Coordinates; destination: Coordinates; route: Point[] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[origin.lat, origin.lng], ...route.map(point => [point.latitude, point.longitude] as [number, number]), [destination.lat, destination.lng]];
    map.fitBounds(points, { padding: [28, 28], maxZoom: 15 });
  }, [destination.lat, destination.lng, origin.lat, origin.lng, map, route]);
  return null;
}

export default function RestaurantRouteMap({ origin, destination, route = [] }: { origin: Coordinates; destination: Coordinates; route?: Point[] }) {
  const [tileSourceIndex, setTileSourceIndex] = useState(0);
  const tileSource = tileSources[tileSourceIndex];
  const path: [number, number][] = route.length
    ? route.map(point => [point.latitude, point.longitude])
    : [[origin.lat, origin.lng], [destination.lat, destination.lng]];
  return (
    <MapContainer center={[origin.lat, origin.lng]} zoom={14} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        key={tileSource.url}
        url={tileSource.url}
        attribution={tileSource.attribution}
        eventHandlers={{ tileerror: () => setTileSourceIndex(current => Math.min(current + 1, tileSources.length - 1)) }}
      />
      <Polyline positions={path} pathOptions={{ color: "#155a3c", weight: 5, opacity: 0.85 }} />
      <CircleMarker center={[origin.lat, origin.lng]} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#1d6a49", fillOpacity: 1 }} />
      <CircleMarker center={[destination.lat, destination.lng]} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#b94c2e", fillOpacity: 1 }} />
      <FitRoute origin={origin} destination={destination} route={route} />
    </MapContainer>
  );
}
