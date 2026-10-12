"use client";

import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Coordinates, Restaurant } from "@/types/location";

type Props = {
  center: Coordinates;
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (restaurant: Restaurant) => void;
  onMapClick: (coordinates: Coordinates) => void;
};

const cartoBasemapKey = process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY;
const radiusMeters = 5000;

const tileSources = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoBasemapKey ? `?key=${cartoBasemapKey}` : ""}`,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
];

function MapSync({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], 14, { animate: true });
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [center, map]);

  return null;
}

function MapClick({ onMapClick }: { onMapClick: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapZoomButtons() {
  const map = useMap();

  return (
    <div className="absolute right-4 top-4 z-[500] overflow-hidden rounded-lg border border-[#DBDAD7] bg-white/95 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex h-9 w-9 items-center justify-center border-b border-[#DBDAD7] text-xl font-semibold leading-none text-[#07241A] transition hover:bg-[#F5F3F0]"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex h-9 w-9 items-center justify-center text-xl font-semibold leading-none text-[#07241A] transition hover:bg-[#F5F3F0]"
        aria-label="Zoom out"
      >
        -
      </button>
    </div>
  );
}

export default function LeafletRestaurantMap({ center, restaurants, selectedId, onSelect, onMapClick }: Props) {
  const [tileSourceIndex, setTileSourceIndex] = useState(0);
  const tileSource = tileSources[tileSourceIndex];

  return (
    <div className="relative min-h-[390px] overflow-hidden bg-[#e8eee9]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          key={tileSource.url}
          attribution={tileSource.attribution}
          eventHandlers={{
            tileerror: () => {
              setTileSourceIndex((current) =>
                current < tileSources.length - 1 ? current + 1 : current,
              );
            },
          }}
          url={tileSource.url}
        />
        <MapSync center={center} />
        <MapClick onMapClick={onMapClick} />
        <MapZoomButtons />
        <Circle
          center={[center.lat, center.lng]}
          pathOptions={{ color: "#99462A", fillColor: "#99462A", fillOpacity: 0.08, weight: 2 }}
          radius={radiusMeters}
        />
        <CircleMarker
          center={[center.lat, center.lng]}
          pathOptions={{ color: "#99462A", fillColor: "#99462A", fillOpacity: 0.95, weight: 3 }}
          radius={9}
        />
        {restaurants.map((restaurant) => (
          <CircleMarker
            key={restaurant.id}
            center={[restaurant.latitude, restaurant.longitude]}
            eventHandlers={{ click: () => onSelect(restaurant) }}
            pathOptions={{
              color: "#ffffff",
              fillColor: selectedId === restaurant.id ? "#a34d32" : "#0f5132",
              fillOpacity: 0.95,
              weight: 2,
            }}
            radius={selectedId === restaurant.id ? 10 : 7}
          />
        ))}
      </MapContainer>
      <div className="absolute left-4 top-4 z-[400] rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#234637] shadow-md">
        {restaurants.length} địa điểm chay trong 5km
      </div>
    </div>
  );
}
