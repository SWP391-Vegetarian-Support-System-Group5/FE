"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, Restaurant } from "@/types/location";

type Props = {
  center: Coordinates;
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (restaurant: Restaurant) => void;
  onMapClick: (coordinates: Coordinates) => void;
};

function MapController({ center, onMapClick }: Pick<Props, "center" | "onMapClick">) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom()); }, [center, map]);
  useMapEvents({ click: (event) => onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

function pinIcon(color: string, selected = false) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${selected ? 22 : 18}px;height:${selected ? 22 : 18}px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 7px #0005;transform:rotate(-45deg)"></span>`,
    iconSize: [selected ? 22 : 18, selected ? 22 : 18],
    iconAnchor: [selected ? 11 : 9, selected ? 22 : 18],
  });
}

export default function LeafletRestaurantMap({ center, restaurants, selectedId, onSelect, onMapClick }: Props) {
  const locationIcon = useMemo(() => pinIcon("#a34d32", true), []);
  return (
    <div className="relative min-h-[390px]">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom className="absolute inset-0 z-0" aria-label="Bản đồ các nhà hàng chay gần bạn">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} onMapClick={onMapClick} />
        <Marker position={[center.lat, center.lng]} icon={locationIcon}>
          <Popup>Vị trí đang chọn</Popup>
        </Marker>
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={pinIcon(selectedId === restaurant.id ? "#a34d32" : "#0f5132", selectedId === restaurant.id)}
            eventHandlers={{ click: () => onSelect(restaurant) }}
          >
            <Popup><strong>{restaurant.name}</strong><br />{restaurant.address}</Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#234637] shadow-md">
        ● {restaurants.length} địa điểm chay
      </div>
    </div>
  );
}
