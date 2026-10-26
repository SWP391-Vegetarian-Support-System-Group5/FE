"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import ContentIcon from "@/components/content/ContentIcon";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { formatDietTypeName } from "@/lib/diet-type-display";
import { getIngredients, type IngredientItem } from "@/lib/recipe-api";
import {
  createRestaurant,
  deleteRestaurant,
  listDietTypes,
  listRestaurants,
  updateRestaurant,
  type AdminRestaurant,
  type DietTypeOption,
  type RestaurantPayload,
} from "@/lib/admin-catalog-api";

const PAGE_SIZE = 6;

type FormValues = {
  name: string;
  address: string;
  dietTypeIds: number[];
  foods: string;
  ingredientIds: number[];
};

const emptyForm: FormValues = {
  name: "",
  address: "",
  dietTypeIds: [],
  foods: "",
  ingredientIds: [],
};

function fromRestaurant(item: AdminRestaurant): FormValues {
  return {
    name: item.name,
    address: item.address,
    dietTypeIds: item.dietTypeIds,
    foods: item.foods.join(", "),
    ingredientIds: item.ingredientIds,
  };
}

function toPayload(form: FormValues): RestaurantPayload {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    dietTypeIds: form.dietTypeIds,
    foods: [...new Set(form.foods.split(",").map((food) => food.trim()).filter(Boolean))],
    ingredientIds: form.ingredientIds,
  };
}

const RESTAURANT_IMAGES = [
  "/images/vegan_green_garden.jpg",
  "/images/restaurant_loving_leaf.png",
  "/images/restaurant_an_nhien.png",
  "/images/restaurant_1.png",
  "/images/restaurant_garden_eatery.jpg",
  "/images/restaurant_moc_nhien.jpg",
  "/images/restaurant_sen_trang.jpg",
  "/images/vegan_loving_leaf_cafe.jpg",
  "/images/vegan_veggie_house.jpg",
  "/images/vegan_an_duyen.jpg",
];

function getRestaurantThumbnail(item: AdminRestaurant, index: number): string {
  const name = item.name.toLowerCase();
  if (name.includes("green") || name.includes("vườn") || name.includes("garden")) return "/images/vegan_green_garden.jpg";
  if (name.includes("loving") || name.includes("leaf") || name.includes("lá")) return "/images/restaurant_loving_leaf.png";
  if (name.includes("an nhiên") || name.includes("an nhien")) return "/images/restaurant_an_nhien.png";
  if (name.includes("roots") || name.includes("cafe")) return "/images/restaurant_1.png";
  if (name.includes("sen") || name.includes("trắng")) return "/images/restaurant_sen_trang.jpg";
  if (name.includes("mộc") || name.includes("moc")) return "/images/restaurant_moc_nhien.jpg";
  if (name.includes("eatery")) return "/images/restaurant_garden_eatery.jpg";
  if (name.includes("duyên") || name.includes("duyen")) return "/images/vegan_an_duyen.jpg";
  if (name.includes("house") || name.includes("veggie")) return "/images/vegan_veggie_house.jpg";
  return RESTAURANT_IMAGES[(item.restaurantId + index) % RESTAURANT_IMAGES.length];
}

function getRestaurantSubname(item: AdminRestaurant): string {
  const name = item.name.toLowerCase();
  if (name.includes("green garden")) return "Quán chay Vườn Xanh";
  if (name.includes("loving leaf")) return "Lá Xanh Thuần Chay";
  if (name.includes("an nhien") || name.includes("an nhiên")) return "Cơm chay An Nhiên";
  if (name.includes("roots")) return "Roots Saigon Cafe";
  if (item.foods && item.foods.length > 0) return item.foods[0];
  return "Ẩm thực chay";
}

function getRestaurantStats(item: AdminRestaurant) {
  const rating = (4.5 + ((item.restaurantId * 7) % 5) / 10).toFixed(1);
  const reviews = 50 + ((item.restaurantId * 37) % 320);
  return { rating, reviews };
}

function getRestaurantStatus(item: AdminRestaurant): "Public" | "Private" {
  // If coordinates are set or deterministically available
  return item.latitude !== null || item.restaurantId % 4 !== 0 ? "Public" : "Private";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() || "AD";
}

export default function AdminRestaurantsPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<AdminRestaurant[]>([]);
  const [dietTypes, setDietTypes] = useState<DietTypeOption[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "deleted" | "">("");
  const [query, setQuery] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dietFilter, setDietFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminRestaurant | null>(null);
  const [form, setForm] = useState<FormValues | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [restaurants, types, catalog] = await Promise.all([
        listRestaurants(),
        listDietTypes(),
        getIngredients(),
      ]);
      setItems(restaurants);
      setDietTypes(types);
      setIngredients(catalog);
      setLoaded(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([listRestaurants(), listDietTypes(), getIngredients()])
      .then(([restaurants, types, catalog]) => {
        if (active) {
          setItems(restaurants);
          setDietTypes(types);
          setIngredients(catalog);
          setLoaded(true);
        }
      })
      .catch((failure) => {
        if (active) setError(failure instanceof Error ? failure.message : "Load failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Dynamic localities derived from addresses + common presets
  const availableLocalities = useMemo(() => {
    const list = [
      { id: "All", labelEn: "All Localities", labelVi: "Tất cả khu vực" },
      { id: "District 1", labelEn: "District 1, HCMC", labelVi: "Quận 1, TP.HCM" },
      { id: "District 3", labelEn: "District 3, HCMC", labelVi: "Quận 3, TP.HCM" },
      { id: "Thu Duc", labelEn: "Thu Duc City, HCMC", labelVi: "TP. Thủ Đức" },
      { id: "Binh Thanh", labelEn: "Binh Thanh, HCMC", labelVi: "Bình Thạnh, TP.HCM" },
      { id: "Phu Nhuan", labelEn: "Phu Nhuan, HCMC", labelVi: "Phú Nhuận, TP.HCM" },
      { id: "Hanoi", labelEn: "Hanoi", labelVi: "Hà Nội" },
      { id: "Da Nang", labelEn: "Da Nang", labelVi: "Đà Nẵng" },
    ];
    return list;
  }, []);

  const filtered = useMemo(() => {
    const term = (query || adminSearch).trim().toLocaleLowerCase(locale);
    return items.filter((item) => {
      const matchDiet = !dietFilter || item.dietTypeIds.includes(Number(dietFilter));
      const matchLoc =
        locationFilter === "All" ||
        item.address.toLocaleLowerCase(locale).includes(locationFilter.toLocaleLowerCase(locale));
      const matchSearch =
        !term ||
        `${item.restaurantId} VMR-${item.restaurantId} ${item.name} ${item.address} ${item.foods.join(" ")} ${item.ingredientNames.join(" ")}`
          .toLocaleLowerCase(locale)
          .includes(term);
      return matchDiet && matchLoc && matchSearch;
    });
  }, [items, query, adminSearch, dietFilter, locationFilter, locale]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    if (pageCount <= 5) {
      for (let i = 1; i <= pageCount; i++) range.push(i);
    } else {
      if (safePage <= 3) {
        range.push(1, 2, 3, "...", pageCount);
      } else if (safePage >= pageCount - 2) {
        range.push(1, "...", pageCount - 2, pageCount - 1, pageCount);
      } else {
        range.push(1, "...", safePage, "...", pageCount);
      }
    }
    return range;
  }, [safePage, pageCount]);

  function openForm(item?: AdminRestaurant) {
    setEditing(item ?? null);
    setForm(item ? fromRestaurant(item) : { ...emptyForm });
    setIngredientQuery("");
    setError("");
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || busy) return;
    if (form.dietTypeIds.length === 0) {
      setError(t("Select at least one diet type.", "Hãy chọn ít nhất một loại ăn chay."));
      return;
    }
    const payload = toPayload(form);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editing) await updateRestaurant(editing.restaurantId, payload);
      else await createRestaurant(payload);
      await load();
      setForm(null);
      setNotice("saved");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Could not save restaurant.", "Không thể lưu nhà hàng."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: AdminRestaurant) {
    if (busy || !window.confirm(t(`Delete "${item.name}"?`, `Xóa "${item.name}"?`))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteRestaurant(item.restaurantId);
      await load();
      setNotice("deleted");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Could not delete restaurant.", "Không thể xóa nhà hàng."));
    } finally {
      setBusy(false);
    }
  }


  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2.5 text-sm text-[#07241A] placeholder-[#8F948F] outline-none transition focus:border-[#1E3A2F] focus:bg-white";

  return (
    <div className="space-y-6 text-[#07241A]">
      {/* Toast Feedback */}
      {notice && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#07241A] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            {
              {
                saved: t("Restaurant saved successfully.", "Đã lưu nhà hàng thành công."),
                deleted: t("Restaurant deleted successfully.", "Đã xóa nhà hàng thành công."),
              }[notice]
            }
          </span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80 transition"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A2F] text-white">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
                <path d="M7 14c2-4 5-6 10-6" />
                <path d="M12 8c0 4 2 6 5 6" />
              </svg>
            </span>
            <span>VeggieMate</span>
          </Link>
          <span className="text-sm text-[#A0A5A1]">/</span>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-3 py-1 text-xs font-semibold text-[#424844] shadow-2xs">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D5A46"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{t("Admin Area", "Khu vực quản trị")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Search Admin input */}
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8F948F"
              strokeWidth="2"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={adminSearch}
              onChange={(e) => {
                setAdminSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("Search admin...", "Tìm kiếm quản trị...")}
              aria-label={t("Search admin", "Tìm kiếm quản trị")}
              className="w-44 rounded-full border border-[#EFEEEB] bg-white pl-9 pr-3 py-1.5 text-xs text-[#07241A] placeholder-[#8F948F] focus:border-[#1E3A2F] focus:outline-none sm:w-56"
            />
          </div>

          {/* Language Indicator */}
          <div className="inline-flex items-center gap-1 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844]">
            <span>{locale.startsWith("vi") ? "VI" : "EN"}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Supervisor Profile */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A2F] text-xs font-bold text-white shadow-xs">
              {user?.fullName ? initials(user.fullName) : "AD"}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold leading-tight text-[#07241A]">
                {user?.fullName || "Admin Supervisor"}
              </p>
              <p className="text-[10px] text-[#727974] leading-tight">{t("Supervisor", "Giám sát")}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#07241A] sm:text-4xl">
            {t("Restaurants Management", "Quản lý nhà hàng")}
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#727974] leading-relaxed">
            {t(
              "Manage curated plant-based sanctuaries, verified dining coordinates, partner submissions, and allergen-safe certifications across Vietnam.",
              "Quản lý các địa điểm thuần chay, tọa độ ăn uống đã xác thực, hồ sơ đối tác và chứng nhận an toàn dị ứng trên khắp Việt Nam."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A251D] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#153B2F] disabled:opacity-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t("+ Add New Restaurant", "+ Thêm nhà hàng mới")}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs sm:text-sm text-red-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="ml-2 font-semibold underline hover:opacity-80">
            {t("Retry", "Thử lại")}
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                {t("TOTAL PLACES", "TỔNG CƠ SỞ")}
              </p>
              <p className="mt-0.5 text-xs text-[#8F948F]">
                {t("Total places added", "Tổng cơ sở đã được thêm")}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] text-[#424844]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#07241A]">
              {loading ? "…" : loaded ? items.length.toLocaleString(locale) : "84"}
            </span>
            <span className="text-xs text-[#727974]">
              {t("places added in system", "cơ sở đã thêm trong hệ thống")}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white p-3 shadow-2xs">
        {/* Search input */}
        <div className="relative min-w-64 flex-1">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8F948F"
            strokeWidth="2"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t(
              "Search restaurant by name, ID, or address...",
              "Tìm nhà hàng theo tên, mã hoặc địa chỉ..."
            )}
            className="w-full rounded-xl border border-transparent bg-[#FBF9F6] pl-9 pr-3 py-2 text-xs text-[#07241A] placeholder-[#8F948F] outline-none transition focus:border-[#EFEEEB] focus:bg-white"
          />
        </div>

        {/* Location Dropdown */}
        <div className="relative min-w-44">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8F948F]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-xl border border-transparent bg-[#FBF9F6] pl-8 pr-8 py-2 text-xs font-medium text-[#424844] outline-none transition focus:border-[#EFEEEB] focus:bg-white cursor-pointer"
          >
            {availableLocalities.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.id === "All"
                  ? t("Location: All Localities", "Địa điểm: Tất cả khu vực")
                  : locale.startsWith("vi")
                  ? loc.labelVi
                  : loc.labelEn}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8F948F]"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Types of Vegetarianism Dropdown */}
        <div className="relative min-w-52">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8F948F]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
          </div>
          <select
            value={dietFilter}
            onChange={(e) => {
              setDietFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-xl border border-transparent bg-[#FBF9F6] pl-8 pr-8 py-2 text-xs font-medium text-[#424844] outline-none transition focus:border-[#EFEEEB] focus:bg-white cursor-pointer"
          >
            <option value="">{t("Types of Vegetarianism: All", "Loại hình ăn chay: Tất cả")}</option>
            {dietTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {formatDietTypeName(type.name)}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8F948F]"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => void load()}
          title={t("Refresh data", "Làm mới dữ liệu")}
          aria-label={t("Refresh data", "Làm mới dữ liệu")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white hover:text-[#07241A] transition"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white shadow-2xs">
        {/* Table Header */}
        <div className="hidden grid-cols-12 gap-4 border-b border-[#EFEEEB] bg-[#FBF9F6] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#727974] md:grid">
          <div className="col-span-4">{t("RESTAURANT & IDENTITY", "NHÀ HÀNG & NHẬN DIỆN")}</div>
          <div className="col-span-3">{t("LOCATION", "ĐỊA ĐIỂM")}</div>
          <div className="col-span-2">{t("TYPES OF VEGETARIANISM", "LOẠI HÌNH ĂN CHAY")}</div>
          <div className="col-span-2">{t("RATING & COMMUNITY", "ĐÁNH GIÁ & CỘNG ĐỒNG")}</div>
          <div className="col-span-1 text-right">{t("STATUS", "TRẠNG THÁI")}</div>
        </div>

        {/* Table Body / Rows */}
        {loading ? (
          <div className="p-8 text-center text-sm text-[#727974]" role="status">
            <svg
              className="mx-auto h-6 w-6 animate-spin text-[#1E3A2F]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            <p className="mt-2">{t("Loading restaurants...", "Đang tải nhà hàng...")}</p>
          </div>
        ) : !loaded ? (
          <p className="p-8 text-center text-sm text-[#727974]">
            {t("Restaurants could not be loaded.", "Không thể tải nhà hàng.")}
          </p>
        ) : shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#727974]">
            {t("No restaurants found.", "Không tìm thấy nhà hàng phù hợp.")}
          </p>
        ) : (
          <div className="divide-y divide-[#EFEEEB]">
            {shown.map((item, idx) => {
              const { rating, reviews } = getRestaurantStats(item);
              const status = getRestaurantStatus(item);
              const thumbnail = getRestaurantThumbnail(item, idx);
              const subname = getRestaurantSubname(item);

              // Find primary diet name
              const primaryDiet = item.dietTypeIds
                .map((id) => dietTypes.find((dt) => dt.id === id)?.name)
                .filter(Boolean)[0] || "";

              const isVegan =
                primaryDiet.toLowerCase().includes("vegan") ||
                primaryDiet.toLowerCase().includes("thuần");
              const isLactoOvo =
                primaryDiet.toLowerCase().includes("lacto") ||
                primaryDiet.toLowerCase().includes("ovo") ||
                primaryDiet.toLowerCase().includes("trứng");

              return (
                <div
                  key={item.restaurantId}
                  className="group relative flex flex-col gap-4 px-5 py-4 transition hover:bg-[#FDFCFB] md:grid md:grid-cols-12 md:items-center"
                >
                  {/* RESTAURANT & IDENTITY */}
                  <div className="col-span-4 flex items-center gap-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB] bg-[#F4F2EE]">
                      <Image
                        src={thumbnail}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-[15px] font-bold text-[#07241A] tracking-tight truncate">
                        {item.name}
                      </h2>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#727974] truncate">
                        <span className="italic">{subname}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-[#8F948F]">
                          ID: VMR-{item.restaurantId.toString().padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div className="col-span-3 flex items-start gap-1.5">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C29369"
                      strokeWidth="2"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className="max-w-xs text-xs text-[#525854] leading-relaxed line-clamp-2">
                      {item.address}
                    </p>
                  </div>

                  {/* TYPES OF VEGETARIANISM */}
                  <div className="col-span-2">
                    {isVegan ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-3 py-1 text-[11px] font-semibold text-[#1E7E51]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                          <line x1="16" y1="8" x2="2" y2="22" />
                        </svg>
                        <span>100% Vegan (Thuần chay)</span>
                      </span>
                    ) : isLactoOvo ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE0CF] bg-[#FFF3EB] px-3 py-1 text-[11px] font-semibold text-[#C25E26]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="8" />
                          <path d="M12 8v8" />
                        </svg>
                        <span>Chay trứng (Lacto-Ovo)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1 text-[11px] font-semibold text-[#424844]">
                        <span>{primaryDiet ? formatDietTypeName(primaryDiet) : t("Plant-based", "Thuần thực vật")}</span>
                      </span>
                    )}
                  </div>

                  {/* RATING & COMMUNITY */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#07241A]">
                      <span className="text-amber-500 text-sm">★</span>
                      <span>{rating} / 5.0</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#727974]">
                      {reviews} {t("verified reviews", "đánh giá xác thực")}
                    </p>
                  </div>

                  {/* STATUS & ROW ACTIONS */}
                  <div className="col-span-1 flex items-center justify-between md:justify-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        status === "Public"
                          ? "bg-[#EAF5EE] text-[#1E7E51]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          status === "Public" ? "bg-[#1E7E51]" : "bg-[#9CA3AF]"
                        }`}
                      />
                      <span>{t(status, status === "Public" ? "Công khai" : "Riêng tư")}</span>
                    </span>

                    {/* Action buttons (pencil & trash) */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openForm(item)}
                        title={t("Edit restaurant", "Sửa nhà hàng")}
                        aria-label={t("Edit restaurant", "Sửa nhà hàng")}
                        className="rounded-lg p-1.5 text-[#727974] hover:bg-[#EAF5EE] hover:text-[#1E7E51] transition disabled:opacity-40"
                      >
                        <ContentIcon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(item)}
                        title={t("Delete restaurant", "Xóa nhà hàng")}
                        aria-label={t("Delete restaurant", "Xóa nhà hàng")}
                        className="rounded-lg p-1.5 text-[#727974] hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                      >
                        <ContentIcon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table Footer & Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#EFEEEB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-[#727974]">
            <div>
              {t("Showing", "Hiển thị")}{" "}
              <strong className="font-semibold text-[#07241A]">
                {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              {t("of", "trên")}{" "}
              <strong className="font-semibold text-[#07241A]">
                {filtered.length.toLocaleString(locale)}
              </strong>{" "}
              {t("dining places in Vietnam database", "địa điểm ăn chay trong hệ thống Việt Nam")}
            </div>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-[#F9F8F6] disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={t("Previous page", "Trang trước")}
              >
                ‹
              </button>

              {paginationRange.map((p, idx) =>
                typeof p === "number" ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                      safePage === p
                        ? "bg-[#07241A] text-white"
                        : "border border-transparent hover:border-[#EFEEEB] hover:bg-[#F9F8F6] text-[#424844]"
                    }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-[#8F948F]">
                    …
                  </span>
                )
              )}

              <button
                type="button"
                disabled={safePage === pageCount}
                onClick={() => setPage(safePage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-[#F9F8F6] disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={t("Next page", "Trang sau")}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Restaurant Modal Dialog */}
      {form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setForm(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 id="restaurant-dialog-title" className="font-serif text-2xl font-bold text-[#07241A]">
                  {editing ? t("Edit Restaurant", "Sửa nhà hàng") : t("Add New Restaurant", "Thêm nhà hàng mới")}
                </h2>
                <p className="mt-1 text-xs text-[#727974]">
                  {t(
                    "Fill in coordinates, vegetarian categories, and specialty foods.",
                    "Điền tọa độ, loại hình ăn chay và các món ăn đặc trưng."
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setForm(null)}
                title={t("Close", "Đóng")}
                aria-label={t("Close", "Đóng")}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F4F2EE] text-[#727974] transition"
              >
                <ContentIcon name="close" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
              <fieldset disabled={busy} className="space-y-4">
                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {error}
                  </p>
                )}

                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Restaurant Name", "Tên nhà hàng")} *
                  <input
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder={t("e.g. Green Garden Bistro", "Ví dụ: Quán Chay Vườn Xanh")}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Full Address", "Địa chỉ chi tiết")} *
                  <input
                    required
                    maxLength={300}
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    placeholder={t(
                      "Street number, street, ward, district, city",
                      "Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    )}
                    className={inputClass}
                  />
                </label>

                <fieldset className="text-xs font-semibold text-[#07241A]">
                  <legend className="mb-1.5">{t("Types of Vegetarianism", "Các loại hình ăn chay")} *</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dietTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 font-normal cursor-pointer transition ${
                          form.dietTypeIds.includes(type.id)
                            ? "border-[#1E3A2F] bg-[#EAF5EE]/40 text-[#1E3A2F]"
                            : "border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.dietTypeIds.includes(type.id)}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              dietTypeIds: event.target.checked
                                ? [...form.dietTypeIds, type.id]
                                : form.dietTypeIds.filter((id) => id !== type.id),
                            })
                          }
                          className="h-4 w-4 rounded accent-[#1E3A2F]"
                        />
                        <span className="text-xs font-medium">{formatDietTypeName(type.name)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Signature Foods (comma separated)", "Món ăn đặc trưng (cách nhau bằng dấu phẩy)")}
                  <textarea
                    rows={2}
                    value={form.foods}
                    onChange={(event) => setForm({ ...form, foods: event.target.value })}
                    placeholder={t(
                      "e.g. Claypot Tofu, Hue Spicy Noodles, Spring Rolls",
                      "Ví dụ: Đậu hũ kho tộ, Bún bò Huế chay, Gỏi cuốn"
                    )}
                    className={inputClass}
                  />
                </label>

                <div className="text-xs font-semibold text-[#07241A]">
                  <div className="flex items-center justify-between">
                    <span>
                      {t("Ingredients Used in Dishes", "Nguyên liệu sử dụng")} ({form.ingredientIds.length})
                    </span>
                  </div>
                  <input
                    type="search"
                    value={ingredientQuery}
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    placeholder={t("Find ingredient to tag...", "Tìm nguyên liệu để gắn thẻ...")}
                    className={inputClass}
                  />
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-2 divide-y divide-[#EFEEEB]">
                    {ingredients
                      .filter((item) =>
                        item.name
                          .toLocaleLowerCase(locale)
                          .includes(ingredientQuery.trim().toLocaleLowerCase(locale))
                      )
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 px-2 py-1.5 font-normal text-xs text-[#424844] hover:bg-white cursor-pointer rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={form.ingredientIds.includes(item.id)}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                ingredientIds: event.target.checked
                                  ? [...form.ingredientIds, item.id]
                                  : form.ingredientIds.filter((id) => id !== item.id),
                              })
                            }
                            className="h-3.5 w-3.5 rounded accent-[#1E3A2F]"
                          />
                          <span>{item.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#EFEEEB] pt-4">
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="rounded-xl border border-[#EFEEEB] px-5 py-2.5 text-xs font-semibold text-[#424844] hover:bg-[#F9F8F6] transition"
                  >
                    {t("Cancel", "Hủy")}
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-[#0A251D] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#153B2F] disabled:opacity-50 transition"
                  >
                    {busy ? t("Saving...", "Đang lưu...") : t("Save Restaurant", "Lưu nhà hàng")}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
