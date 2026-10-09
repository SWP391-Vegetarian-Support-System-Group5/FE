"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";

type Coordinates = {
  lat: number;
  lng: number;
};

type Props = {
  coordinates: Coordinates | null;
  areaLabel: string;
};

const defaultCenter: Coordinates = { lat: 10.8231, lng: 106.6297 };
const cartoBasemapKey = process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY;

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

function MapMover({ coordinates }: { coordinates: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    const nextCenter = coordinates ?? defaultCenter;
    map.setView([nextCenter.lat, nextCenter.lng], coordinates ? 16 : 12, {
      animate: true,
    });
  }, [coordinates, map]);

  return null;
}

function MapZoomButtons() {
  const map = useMap();

  return (
    <div className="absolute right-3 top-3 z-[500] overflow-hidden rounded-lg border border-[#DBDAD7] bg-white/95 shadow-sm backdrop-blur">
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

export default function ProfileLeafletMap({ coordinates, areaLabel }: Props) {
  const center = coordinates ?? defaultCenter;
  const [tileSourceIndex, setTileSourceIndex] = useState(0);
  const tileSource = tileSources[tileSourceIndex];

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-[#EAE8E5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={coordinates ? 16 : 12}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
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
        <MapMover coordinates={coordinates} />
        <MapZoomButtons />
        <CircleMarker
          center={[center.lat, center.lng]}
          pathOptions={{
            color: "#99462A",
            fillColor: "#99462A",
            fillOpacity: 0.9,
            weight: 3,
          }}
          radius={9}
        />
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] text-[#07241A] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <span className="inline-block h-2 w-2 rounded-full bg-[#99462A]" />
        <span>Active radius: 5.0 km around {areaLabel}</span>
      </div>
    </div>
  );
}
