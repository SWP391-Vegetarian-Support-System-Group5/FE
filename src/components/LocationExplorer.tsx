"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GoogleRestaurantMap from "@/components/GoogleRestaurantMap";
import { geocodeAddress, hasGoogleMapsKey } from "@/lib/google-maps";
import { locationApi } from "@/lib/location-api";
import { provinceCenters } from "@/lib/location-data";
import type { Area, Coordinates, Province, Restaurant } from "@/types/location";

const defaultCenter = { lat: 10.8496, lng: 106.7537 };

export default function LocationExplorer() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [provinceCode, setProvinceCode] = useState("hochiminh");
  const [areaCode, setAreaCode] = useState("all");
  const [address, setAddress] = useState("42 Võ Văn Ngân, Phường Thủ Đức");
  const [center, setCenter] = useState<Coordinates>(defaultCenter);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const province = useMemo(() => provinces.find((item) => item.code === provinceCode), [provinces, provinceCode]);
  const area = useMemo(() => areas.find((item) => item.code === areaCode), [areas, areaCode]);

  useEffect(() => { locationApi.provinces().then(setProvinces); }, []);

  useEffect(() => {
    locationApi.areas(provinceCode).then(setAreas);
  }, [provinceCode]);

  const loadRestaurants = useCallback(async (coordinates = center) => {
    setLoading(true);
    const data = await locationApi.restaurants(provinceCode, areaCode, coordinates.lat, coordinates.lng);
    setRestaurants(data);
    setSelected(data[0]);
    setLoading(false);
  }, [areaCode, center, provinceCode]);

  useEffect(() => {
    let active = true;
    // Area filters trigger a fresh query; map panning alone intentionally does not.
    locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng).then((data) => {
      if (!active) return;
      setRestaurants(data);
      setSelected(data[0]);
      setLoading(false);
    });
    return () => { active = false; };
    // The center is searched explicitly so dragging/selecting a marker does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaCode, provinceCode]);

  const changeProvince = (nextProvinceCode: string) => {
    setLoading(true);
    setProvinceCode(nextProvinceCode);
    setAreaCode("all");
    const nextCenter = provinceCenters[nextProvinceCode];
    if (nextCenter) setCenter(nextCenter);
  };

  const changeArea = (nextAreaCode: string) => {
    setLoading(true);
    setAreaCode(nextAreaCode);
    const nextArea = areas.find((item) => item.code === nextAreaCode);
    if (nextArea?.latitude != null && nextArea.longitude != null) {
      setCenter({ lat: nextArea.latitude, lng: nextArea.longitude });
    }
  };

  const searchAddress = async () => {
    setMessage("");
    if (!address.trim()) {
      setMessage("Vui lòng nhập địa chỉ sinh sống.");
      return;
    }
    if (!hasGoogleMapsKey()) {
      setMessage("Cần Google Maps API key để xác định tọa độ. Bộ lọc khu vực vẫn đang hoạt động với dữ liệu mẫu.");
      await loadRestaurants();
      return;
    }
    try {
      const result = await geocodeAddress(`${address}, ${area?.name ?? ""}, ${province?.name ?? ""}, Việt Nam`);
      const nextCenter = { lat: result.lat, lng: result.lng };
      setAddress(result.formattedAddress);
      setCenter(nextCenter);
      await loadRestaurants(nextCenter);
      setMessage("Đã cập nhật các địa điểm chay gần địa chỉ này.");
    } catch {
      setMessage("Không tìm thấy địa chỉ. Hãy nhập thêm số nhà, tên đường hoặc phường/xã.");
    }
  };

  const useCurrentLocation = () => {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Trình duyệt này không hỗ trợ định vị.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const nextCenter = { lat: coords.latitude, lng: coords.longitude };
        setCenter(nextCenter);
        await loadRestaurants(nextCenter);
        setMessage("Đã dùng vị trí hiện tại của bạn.");
      },
      () => setMessage("Không thể truy cập vị trí. Hãy cấp quyền định vị cho trình duyệt."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-12 lg:py-14">
      <div className="mb-8 max-w-2xl">
        <span className="rounded-full bg-[#dcebe1] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#22513c]">Vegan places guide</span>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-[#07241A] sm:text-5xl">Find vegetarian places near you</h1>
        <p className="mt-3 leading-7 text-[#5c645f]">Khám phá nhà hàng, quán cà phê và địa điểm thuần chay dựa trên khu vực sinh sống của bạn.</p>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-[#edeae5] bg-white shadow-[0_12px_40px_rgba(27,58,45,0.07)]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#09281d]">Living Location</h2>
              <p className="mt-1 text-sm text-[#69706b]">Your home base coordinates for organic markets, plant bistros, and localized seasonal harvest.</p>
            </div>
            <button type="button" onClick={useCurrentLocation} title="Dùng vị trí hiện tại" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f1ed] text-[#123f2e] transition hover:bg-[#dcebe1]">⌖</button>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl bg-[#f1f1ee] p-4 text-xs leading-5 text-[#24342d]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#cceedd] text-[#006c47]">◎</span>
            <p>Your location helps VeggieMate recommend vegetarian places near you in the <strong>Vegan Places Guide</strong> and filter neighborhood community dining tables.</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-[#274537]">
              City / Province
              <select value={provinceCode} onChange={(event) => changeProvince(event.target.value)} className="mt-2 w-full appearance-none rounded-xl border-0 bg-[#f5f3f0] px-4 py-3.5 text-sm font-normal text-[#18372a] outline-none ring-[#356d54] focus:ring-2">
                {provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#274537]">
              Ward / Commune / Area
              <select value={areaCode} onChange={(event) => changeArea(event.target.value)} className="mt-2 w-full appearance-none rounded-xl border-0 bg-[#f5f3f0] px-4 py-3.5 text-sm font-normal text-[#18372a] outline-none ring-[#356d54] focus:ring-2">
                {areas.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-xs font-semibold text-[#274537]">
            Living Address
            <span className="mt-2 flex items-center rounded-xl bg-[#f5f3f0] px-4 ring-[#356d54] focus-within:ring-2">
              <span className="mr-3 text-[#a34d32]">⌖</span>
              <input value={address} onChange={(event) => setAddress(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void searchAddress()} placeholder="Số nhà, tên đường, phường/xã" className="w-full bg-transparent py-3.5 text-sm font-normal text-[#18372a] outline-none" />
              <button type="button" onClick={searchAddress} className="ml-3 rounded-lg bg-[#143f2e] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0a2d20]">Tìm kiếm</button>
            </span>
          </label>
          {message && <p role="status" className="mt-3 text-xs text-[#8b4a34]">{message}</p>}
        </div>

        <div className="grid border-t border-[#edeae5] lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <GoogleRestaurantMap center={center} restaurants={restaurants} selectedId={selected?.id} onSelect={setSelected} onMapClick={setCenter} />
          <aside className="max-h-[510px] overflow-y-auto bg-[#fbfaf8] p-5">
            <div className="mb-4 flex items-end justify-between">
              <div><h3 className="font-serif text-xl font-semibold text-[#09281d]">Places nearby</h3><p className="mt-1 text-xs text-[#788079]">Trong bán kính tối đa 15 km</p></div>
              <span className="rounded-full bg-[#e4eee7] px-2.5 py-1 text-xs font-bold text-[#24543d]">{restaurants.length}</span>
            </div>
            {loading ? <p className="py-10 text-center text-sm text-[#788079]">Đang tìm địa điểm…</p> : restaurants.length === 0 ? <p className="rounded-xl bg-white p-5 text-sm leading-6 text-[#6b736d]">Chưa có dữ liệu nhà hàng cho khu vực này. Hãy chọn “Tất cả khu vực” hoặc bổ sung dữ liệu từ Google Places/DB.</p> : (
              <div className="space-y-3">{restaurants.map((restaurant) => (
                <button key={restaurant.id} type="button" onClick={() => { setSelected(restaurant); setCenter({ lat: restaurant.latitude, lng: restaurant.longitude }); }} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === restaurant.id ? "border-[#397158] bg-[#eef5f0] shadow-sm" : "border-[#ebe8e2] bg-white hover:border-[#b9cfc2]"}`}>
                  <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a34d32]">{restaurant.category}</span><h4 className="mt-1 font-serif text-lg font-semibold text-[#123629]">{restaurant.name}</h4></div><span className="whitespace-nowrap text-xs font-bold text-[#775c20]">{restaurant.rating > 0 ? `★ ${restaurant.rating}` : "Mới"}</span></div>
                  <p className="mt-2 text-xs leading-5 text-[#677069]">{restaurant.address}</p>
                  <p className="mt-2 text-[11px] text-[#8a918c]">{restaurant.reviewCount > 0 ? `${restaurant.reviewCount} đánh giá` : "Chưa có đánh giá"}{restaurant.distanceKm != null ? ` · ${restaurant.distanceKm} km` : ""}</p>
                </button>
              ))}</div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
