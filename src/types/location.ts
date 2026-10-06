export type Province = {
  code: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
};

export type Area = {
  code: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  address: string;
  provinceCode: string;
  areaCode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  distanceKm?: number | null;
};
