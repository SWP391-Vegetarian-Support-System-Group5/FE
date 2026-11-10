"use client";

import ContentIcon from "@/components/content/ContentIcon";
import AllergenRequestsPanel from "@/components/profile/AllergenRequestsPanel";
import AllergenSelectionSave from "@/components/profile/AllergenSelectionSave";

import UiText, { useUiText } from "@/components/UiText";


import { useState, useRef, useCallback, useEffect } from "react";
import ImageManager from "@/components/ui/ImageManager";
import { uploadAvatar, deleteAvatar } from "@/lib/image-api";
import { setSessionUser } from "@/lib/auth-session";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import dynamic from "next/dynamic";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import {
  computeBmi,
  classifyBmi,
} from "@/types/profile";
import {
  getProfile,
  updateProfile,
  getDietTypes,
  getAllAllergens,
  getUserAllergens,
  updateUserAllergens,
  getProvinces,
  getAddressSuggestions,
  geocodeAddress,
  type DietTypeItem,
  type AllergenItem,
  type ProvinceItem,
  type AreaItem,
  type AddressSuggestion,
  type UpdateProfilePayload,
  updateLivingLocation,
} from "@/lib/profile-api";
import { locationApi } from "@/lib/location-api";
import { fallbackAreas } from "@/lib/location-data";
import { getMediaUrl } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import { dietTypeAvoidsText, formatDietTypeName } from "@/lib/diet-type-display";
import { saveLivingLocation } from "@/lib/living-location";
import { useLanguage } from "@/context/LanguageContext";
import { ACTIVITY_LEVELS, birthYearFromDate, birthDateForYear, validBirthYear, isActivityLevel } from "@/lib/profile-energy";

const ProfileLeafletMap = dynamic(() => import("@/components/profile/ProfileLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full rounded-xl bg-[#EAE8E5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" />
  ),
});

// ─── Draft shape — only fields the backend actually supports ─────────────────

interface ProfileDraft {
  fullName: string;
  email: string;
  sex: "MALE" | "FEMALE" | null;
  birthYear: string;
  birthDate: string | null;
  heightCm: string; // kept as string for controlled input
  weightKg: string;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE" | null;
  goalWeightKg: string;
  dietTypeId: number | null;
}

interface ProfileErrors {
  birthYear?: string;
  fullName?: string;
  heightCm?: string;
  weightKg?: string;
}

function toAreaItems(items: Array<{ code: string; name: string; type: string; latitude?: number | null; longitude?: number | null }>): AreaItem[] {
  return items.map((item) => ({
    ...item,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
  }));
}

function validateDraft(d: ProfileDraft, currentYear: number): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!d.fullName.trim()) errors.fullName = "Full name is required.";
  if (d.birthYear && !validBirthYear(d.birthYear, currentYear))
    errors.birthYear = `Nhập năm sinh từ ${currentYear - 120} đến ${currentYear}.`;
  const h = Number(d.heightCm);
  if (d.heightCm !== "" && (!Number.isFinite(h) || h < 1 || h > 300))
    errors.heightCm = "Chiều cao phải từ 1 đến 300 cm.";
  const w = Number(d.weightKg);
  if (d.weightKg !== "" && (!Number.isFinite(w) || w < 1 || w > 1000))
    errors.weightKg = "Cân nặng phải từ 1 đến 1.000 kg.";
  return errors;
}

function normalizeLocationName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(thanh pho|tp|tinh|phuong|xa|dac khu|khu vuc)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProfileForm() {
  const { user, loading } = useAuth();
  const [reloadVersion, setReloadVersion] = useState(0);
  if (loading) return <p role="status">Đang tải hồ sơ…</p>;
  if (!user || !getStoredToken()) return <p role="alert">Vui lòng <Link href="/login" className="underline">đăng nhập</Link> để xem hồ sơ.</p>;
  return <ProfileFields key={`${user.uid}:${reloadVersion}`} onRetry={() => setReloadVersion(value => value + 1)} />;
}

function ProfileFields({ onRetry }: { onRetry: () => void }) {
  const ui = useUiText();
  const { language, t, locale } = useLanguage();
  const currentYear = new Date().getFullYear();
  // ── Core state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<"session" | "unavailable" | null>(null);
  useEffect(() => {
    if (loading || loadFailure || window.location.hash !== "#living-location") return;
    document.getElementById("living-location")?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [loading, loadFailure]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});

  // Profile draft
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: "",
    email: "",
    sex: null,
    birthYear: "",
    birthDate: null,
    heightCm: "",
    weightKg: "",
    activityLevel: null,
    goalWeightKg: "",
    dietTypeId: null,
  });
  const [savedDraft, setSavedDraft] = useState<ProfileDraft>({ ...draft });

  // Reference data from API
  const [dietTypes, setDietTypes] = useState<DietTypeItem[]>([]);
  const [allAllergens, setAllAllergens] = useState<AllergenItem[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([]);
  const [savedAllergenIds, setSavedAllergenIds] = useState<number[]>([]);
  const [allergenSaving, setAllergenSaving] = useState(false);
  const applySavedAllergens = useCallback((items: AllergenItem[]) => {
    const ids = items.map(item => item.allergenId);
    setSelectedAllergenIds(ids);
    setSavedAllergenIds([...ids]);
  }, []);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);

  // Administrative selectors help geocoding; the normalized address and coordinates are persisted.
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // UI toggles
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  const [showSexDropdown, setShowSexDropdown] = useState(false);
  const dietDropdownRef = useRef<HTMLDivElement>(null);
  const sexDropdownRef = useRef<HTMLDivElement>(null);
  const addressSuggestionsRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user: avatarOwner } = useAuth();
  const avatarToken = getStoredToken();
  function applyAvatar(url: string | null) {
    setAvatarUrl(url);
    const current = getStoredUser();
    if (current && avatarToken && getStoredToken() === avatarToken && current.userId === avatarOwner?.userId) {
      setSessionUser({ ...current, avatarUrl: url });
    }
  }
  async function refreshAvatar() {
    const profile = await getProfile();
    applyAvatar(profile.avatarUrl ?? null);
  }

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      // 1. Load public reference data (no auth needed) in parallel
      const [dtList, allergenList, provList] = await Promise.allSettled([
        getDietTypes(),
        getAllAllergens(),
        getProvinces(),
      ]);

      if (cancelled) return;

      if (dtList.status === "fulfilled") setDietTypes(dtList.value);
      if (allergenList.status === "fulfilled") setAllAllergens(allergenList.value);
      if (provList.status === "fulfilled") setProvinces(provList.value);

      // 2. Load authenticated user data
      try {
        const [profile, userAllergenList] = await Promise.all([
          getProfile(),
          getUserAllergens(),
        ]);

        if (cancelled) return;

        const d: ProfileDraft = {
          fullName: profile.fullName ?? "",
          email: profile.email ?? "",
          sex: profile.sex ?? null,
          birthYear: profile.birthYear != null ? String(profile.birthYear) : birthYearFromDate(profile.birthDate),
          birthDate: profile.birthDate ?? null,
          heightCm: profile.heightCm != null ? String(profile.heightCm) : "",
          weightKg: profile.weightKg != null ? String(profile.weightKg) : "",
          activityLevel: profile.activityLevel ?? null,
          goalWeightKg: profile.goalWeightKg != null ? String(profile.goalWeightKg) : "",
          dietTypeId: profile.dietTypeId ?? null,
        };

        setAvatarUrl(profile.avatarUrl ?? null);
        setDraft(d);
        setSavedDraft({ ...d });
        if (profile.latitude != null && profile.longitude != null) {
          setSelectedCoords({ lat: profile.latitude, lng: profile.longitude });
        }
        if (profile.livingAddress) setAddressQuery(profile.livingAddress);
        else if (profile.latitude != null && profile.longitude != null) {
          try {
            const location = await locationApi.reverseGeocode(profile.latitude, profile.longitude);
            if (!cancelled && location?.formattedAddress) {
              setAddressQuery(location.formattedAddress);
              void updateLivingLocation(profile.latitude, profile.longitude, location.formattedAddress).catch(() => undefined);
            }
          } catch {
            // Coordinates still render on the map when reverse geocoding is unavailable.
          }
        }

        // userAllergens may come as array or wrapped object — normalize
        const rawAllergens: unknown = userAllergenList;
        const allergenArr: AllergenItem[] = Array.isArray(rawAllergens)
          ? rawAllergens
          : Array.isArray((rawAllergens as Record<string, unknown>)?.allergens)
            ? (rawAllergens as Record<string, unknown>).allergens as AllergenItem[]
            : [];
        const ids = allergenArr.map((a) => a.allergenId);
        setSelectedAllergenIds(ids);
        setSavedAllergenIds([...ids]);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "";
          // This is a handled loading failure: keep it visible in the page,
          // and never expose an empty editable profile or a disappearing toast.
          setLoadFailure(msg.includes("401") ? "session" : "unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // Old accounts already have a saved address/coordinates but no saved
  // administrative codes. Infer the two selectors from that address instead
  // of making the user choose the same place again.
  useEffect(() => {
    if (!addressQuery.trim() || provinces.length === 0 || selectedProvinceCode) return;

    const normalizedAddress = normalizeLocationName(addressQuery);
    const matchingProvince = provinces.find((item) =>
      normalizedAddress.includes(normalizeLocationName(item.name)),
    );
    if (!matchingProvince) return;

    let active = true;
    void locationApi.areas(matchingProvince.code)
      .then((areaList) => {
        if (!active) return;
        setSelectedProvinceCode(matchingProvince.code);
        const matchingArea = areaList.find((item) =>
          item.code !== "all" && normalizedAddress.includes(normalizeLocationName(item.name)),
        );
        setAreas(toAreaItems(areaList));
        setSelectedAreaCode(matchingArea?.code ?? "");
      })
      .catch(() => {
        // Province remains selected even when the ward list is temporarily unavailable.
        if (active) {
          setSelectedProvinceCode(matchingProvince.code);
          const areaList = toAreaItems(fallbackAreas(matchingProvince.code));
          setAreas(areaList);
          const matchingArea = areaList.find((item) =>
            item.code !== "all" && normalizedAddress.includes(normalizeLocationName(item.name)),
          );
          setSelectedAreaCode(matchingArea?.code ?? "");
        }
      });

    return () => { active = false; };
  }, [addressQuery, provinces, selectedProvinceCode]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (dietDropdownRef.current && !dietDropdownRef.current.contains(t))
        setShowDietDropdown(false);
      if (sexDropdownRef.current && !sexDropdownRef.current.contains(t))
        setShowSexDropdown(false);
      if (addressSuggestionsRef.current && !addressSuggestionsRef.current.contains(t))
        setShowAddressSuggestions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Toast auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const bmi = computeBmi(draft.heightCm, draft.weightKg);
  const bmiCategory = bmi !== null ? classifyBmi(bmi) : null;
  const selectedActivity = ACTIVITY_LEVELS.find(level => level.value === draft.activityLevel);

  const currentDietType = dietTypes.find((d) => d.dietTypeId === draft.dietTypeId);
  const currentDietTypeExplanation = dietTypeAvoidsText(currentDietType, language);

  const selectedProvince = provinces.find((p) => p.code === selectedProvinceCode);
  const selectedArea = areas.find((a) => a.code === selectedAreaCode);

  // ── Field updater ────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ProfileErrors];
        return next;
      });
    },
    [],
  );

  // ── Province selection → load areas ──────────────────────────────────────
  const handleProvinceSelect = useCallback(
    async (code: string) => {
      const province = provinces.find((item) => item.code === code);
      setSelectedProvinceCode(code);
      setSelectedAreaCode("");
      // Keep the selector usable while the API replaces these fallback options.
      setAreas(toAreaItems(fallbackAreas(code)));
      setAddressQuery("");
      if (province?.latitude != null && province.longitude != null) {
        setSelectedCoords({ lat: province.latitude, lng: province.longitude });
      }
      try {
        // Use the shared location API because it has a safe local fallback
        // when the reference-data endpoint is temporarily unavailable.
        const areaList = await locationApi.areas(code);
        setAreas(toAreaItems(areaList));
      } catch (err) {
        console.error("Failed to load areas", err);
      }
    },
    [provinces],
  );

  const handleAreaSelect = useCallback(async (area: AreaItem) => {
    setSelectedAreaCode(area.code);

    if (area.latitude != null && area.longitude != null) {
      setSelectedCoords({ lat: area.latitude, lng: area.longitude });
      return;
    }

    const provinceName = provinces.find((p) => p.code === selectedProvinceCode)?.name ?? "";
    try {
      const result = await geocodeAddress(`${area.name}, ${provinceName}, Việt Nam`);
      setSelectedCoords({ lat: result.latitude, lng: result.longitude });
      setAddressQuery(result.formattedAddress);
    } catch {
      setToastMessage("Could not find coordinates for this area. Try typing a detailed address.");
    }
  }, [provinces, selectedProvinceCode]);

  // ── Address search ───────────────────────────────────────────────────────
  const addressSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddressSearch = useCallback((query: string) => {
    setAddressQuery(query);
    if (addressSearchTimer.current) clearTimeout(addressSearchTimer.current);
    if (query.trim().length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }
    addressSearchTimer.current = setTimeout(async () => {
      try {
        const suggestions = await getAddressSuggestions(query);
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(suggestions.length > 0);
        const first = suggestions[0];
        if (first) setSelectedCoords({ lat: first.latitude, lng: first.longitude });
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);
  }, [setShowAddressSuggestions]);

  const handleAddressSuggestionSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddressQuery(suggestion.label);
    setSelectedCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
    setShowAddressSuggestions(false);
  }, [setShowAddressSuggestions]);

  // ── Allergy toggle ───────────────────────────────────────────────────────
  const toggleAllergen = useCallback((id: number) => {
    setSelectedAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);



  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (allergenSaving) return;
    setSaveError(null);
    setDraft({ ...savedDraft });
    setSelectedAllergenIds([...savedAllergenIds]);
    setErrors({});
    setToastMessage(null);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving || allergenSaving) return;
    setSaveError(null);
    const validationErrors = validateDraft(draft, currentYear);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        fullName: draft.fullName,
        sex: draft.sex,
        birthDate: birthDateForYear(draft.birthYear, draft.birthDate),
        birthYear: draft.birthYear ? Number(draft.birthYear) : null,
        heightCm: draft.heightCm ? parseFloat(draft.heightCm) : null,
        weightKg: draft.weightKg ? parseFloat(draft.weightKg) : null,
        activityLevel: draft.activityLevel,
        goalWeightKg: draft.goalWeightKg ? parseFloat(draft.goalWeightKg) : null,
        dietTypeId: draft.dietTypeId,
        latitude: selectedCoords?.lat ?? null,
        longitude: selectedCoords?.lng ?? null,
        livingAddress: addressQuery.trim() || null,
      };

      const [updatedProfile] = await Promise.all([
        updateProfile(payload),
        updateUserAllergens(selectedAllergenIds),
      ]);

      const newDraft: ProfileDraft = {
        fullName: updatedProfile.fullName ?? "",
        email: updatedProfile.email ?? "",
        sex: updatedProfile.sex ?? null,
        birthYear: updatedProfile.birthYear != null ? String(updatedProfile.birthYear) : birthYearFromDate(updatedProfile.birthDate),
        birthDate: updatedProfile.birthDate ?? null,
        heightCm:
          updatedProfile.heightCm != null
            ? String(updatedProfile.heightCm)
            : "",
        weightKg:
          updatedProfile.weightKg != null
            ? String(updatedProfile.weightKg)
            : "",
        activityLevel: updatedProfile.activityLevel ?? null,
        goalWeightKg: updatedProfile.goalWeightKg != null ? String(updatedProfile.goalWeightKg) : "",
        dietTypeId: updatedProfile.dietTypeId ?? null,
      };

      setDraft(newDraft);
      setSavedDraft({ ...newDraft });
      setSavedAllergenIds([...selectedAllergenIds]);
      if (updatedProfile.latitude != null && updatedProfile.longitude != null) {
        saveLivingLocation({
          provinceCode: selectedProvinceCode || "hochiminh",
          areaCode: selectedAreaCode || "all",
          address: addressQuery,
          center: { lat: updatedProfile.latitude, lng: updatedProfile.longitude },
        });
      }
      setErrors({});
      setToastMessage("Profile updated successfully.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể hoàn tất lưu hồ sơ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div role="status" className="flex flex-col items-center justify-center gap-4 py-20">
        <svg aria-hidden="true" className="h-8 w-8 animate-spin text-[#1E3A2F] motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
        <span className="text-sm text-[#727974]">{t("Loading profile...", "Đang tải hồ sơ...")}</span>
      </div>
    );
  }

  if (loadFailure) {
    const sessionExpired = loadFailure === "session";
    return <section className="space-y-6">
      <h1 className="font-serif text-3xl font-medium text-[#07241A] sm:text-[40px]">Hồ sơ của tôi</h1>
      <div className="vm-card rounded-2xl border border-[#E5E7DF] bg-white p-6 sm:p-8">
        <div role="alert" className="flex items-start gap-4">
          <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#99462A]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16v1" /></svg>
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-lg font-medium text-[#07241A]">{sessionExpired ? "Phiên đăng nhập đã hết hạn" : "Chưa tải được hồ sơ"}</h2>
            <p className="max-w-xl text-sm leading-6 text-[#727974]">{sessionExpired
              ? "Vui lòng đăng nhập lại để xem và chỉnh sửa thông tin cá nhân."
              : "Hiện chưa thể tải thông tin từ máy chủ. Bạn có thể thử lại sau ít phút."}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {sessionExpired
            ? <Link href="/login" className="vm-button rounded-xl bg-[#254B38] px-5 py-2.5 text-sm font-medium text-white">Đăng nhập lại</Link>
            : <button type="button" onClick={onRetry} className="vm-button rounded-xl bg-[#254B38] px-5 py-2.5 text-sm font-medium text-white">Thử tải lại</button>}
          <Link href="/" className="vm-button rounded-xl border border-[#E5E7DF] px-5 py-2.5 text-sm text-[#424844]">Về trang chủ</Link>
        </div>
      </div>
    </section>;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {saveError && <div role="alert" className="vm-feedback rounded-2xl border border-[#E6C6BA] bg-[#FFF6F2] p-4 text-sm text-[#99462A]">
        <p className="font-semibold">{t("Could not finish saving your profile", "Chưa thể hoàn tất lưu hồ sơ")}</p>
        <p className="mt-1 whitespace-pre-line"><UiText text={saveError} /></p>
      </div>}
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 max-w-sm animate-fade-in rounded-xl bg-[#07241A] px-5 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex-1">{<UiText text={toastMessage} />}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white transition"
              aria-label={ui("Dismiss")}
            >
              <ContentIcon name="close" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ 1. PAGE INTRODUCTION ═══ */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-[0.05em] uppercase text-[#727974]"><UiText text={"Tài khoản & tùy chọn"} /></span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#99462A]" />
        </div>
        <h1 className="font-serif text-[40px] leading-[48px] font-medium tracking-[-0.025em] text-[#07241A]"><UiText text={"Hồ sơ của tôi"} /></h1>
        <p className="max-w-[672px] text-[15px] leading-6 text-[#424844]"><UiText text={"Quản lý thông tin cá nhân, sức khỏe và nơi sinh sống để nhận gợi ý bữa ăn phù hợp."} /></p>
      </section>

      {/* ═══ 2. PROFILE SUMMARY CARD ═══ */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#EFEEEB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            {avatarUrl ? (
              <Image
                src={getMediaUrl(avatarUrl)}
                alt={draft.fullName || "Ảnh đại diện"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#CAEADA] text-2xl font-bold text-[#1E3A2F]">
                {draft.fullName
                  ? draft.fullName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              {draft.fullName || "Tên của bạn"}
            </h2>
            <span className="text-[13px] leading-5 text-[#727974]">
              {draft.email}
            </span>
          </div>
        </div>

        <ImageManager imageUrl={avatarUrl} onUpload={uploadAvatar} onDelete={deleteAvatar}
          onApplied={result => applyAvatar(result.imageUrl)} onRefresh={refreshAvatar} disabled={saving} />
      </section>

      {/* ═══ 3. PERSONAL INFORMATION CARD ═══ */}
      <section className="vm-form-panel rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]"><UiText text={"Thông tin cá nhân"} /></h2>
            <p className="text-[13px] leading-5 text-[#727974]"><UiText text={"Dùng trong thảo luận công thức, xác nhận hoạt động và nhận diện thành viên."} /></p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3F0]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E3A2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]"><UiText text={"Họ và tên"} /></label>
            <input
              type="text"
              value={draft.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className={`rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20 ${
                errors.fullName ? "ring-2 ring-[#99462A]/40" : ""
              }`}
              placeholder={ui("Your full name")}
            />
            {errors.fullName && (
              <span className="text-xs text-[#99462A]">{<UiText text={errors.fullName} />}</span>
            )}
          </div>

          {/* Email Address (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]"><UiText text={"Địa chỉ email"} /></label>
            <input
              type="email"
              value={draft.email}
              readOnly
              className="rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#727974] outline-none cursor-not-allowed"
              title={ui("Email cannot be changed")}
            />
          </div>

          {/* Gender dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]"><UiText text={"Giới tính"} /></label>
            <div ref={sexDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSexDropdown((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
              >
                <span>
                  {draft.sex === "MALE"
                    ? ui("Male")
                    : draft.sex === "FEMALE"
                      ? ui("Female")
                      : ui("Not specified")}
                </span>
                <svg
                  width="9"
                  height="6"
                  viewBox="0 0 9 6"
                  fill="none"
                  className={`text-[#727974] transition ${showSexDropdown ? "rotate-180" : ""}`}
                >
                  <path
                    d="M1 1L4.5 4.5L8 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showSexDropdown && (
                <div className="absolute left-0 top-full z-[1000] mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                  {([
                    { value: null as "MALE" | "FEMALE" | null, label: "Not specified" },
                    { value: "MALE" as const, label: "Male" },
                    { value: "FEMALE" as const, label: "Female" },
                  ]).map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        updateField("sex", opt.value);
                        setShowSexDropdown(false);
                      }}
                      className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#F5F3F0] ${
                        draft.sex === opt.value
                          ? "bg-[#F5F3F0] font-semibold text-[#07241A]"
                          : "text-[#424844]"
                      }`}
                    >
                      {<UiText text={opt.label} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. HEALTH PROFILE CARD ═══ */}
      <section className="vm-form-panel rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              {t("Health Profile", "Hồ sơ sức khỏe")}
            </h2>
            <p className="text-[13px] leading-5 text-[#727974]">
              {t(
                "Configures ingredient substitutions and nutrient balance in seasonal menus.",
                "Cấu hình thay thế nguyên liệu và cân bằng dinh dưỡng cho thực đơn.",
              )}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3F0]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E3A2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>

        {/* Height, weight and birth year */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Height */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              {t("Height", "Chiều cao")}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={draft.heightCm}
                onChange={(e) => updateField("heightCm", e.target.value)}
                className={`w-full rounded-xl bg-[#F5F3F0] py-2.5 pl-4 pr-12 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20 ${
                  errors.heightCm ? "ring-2 ring-[#99462A]/40" : ""
                }`}
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-[0.02em] text-[#727974]">
                cm
              </span>
            </div>
            {errors.heightCm && (
              <span className="text-xs text-[#99462A]">{<UiText text={errors.heightCm} />}</span>
            )}
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              {t("Weight", "Cân nặng")}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={draft.weightKg}
                onChange={(e) => updateField("weightKg", e.target.value)}
                className={`w-full rounded-xl bg-[#F5F3F0] py-2.5 pl-4 pr-12 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20 ${
                  errors.weightKg ? "ring-2 ring-[#99462A]/40" : ""
                }`}
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-[0.02em] text-[#727974]">
                kg
              </span>
            </div>
            {errors.weightKg && (
              <span className="text-xs text-[#99462A]">{<UiText text={errors.weightKg} />}</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-birth-year" className="text-xs font-semibold tracking-[0.02em] text-[#424844]">Năm sinh</label>
            <input id="profile-birth-year" type="text" inputMode="numeric" autoComplete="bday-year" maxLength={4}
              value={draft.birthYear} onChange={event => updateField("birthYear", event.target.value)}
              aria-invalid={!!errors.birthYear} aria-describedby={errors.birthYear ? "profile-birth-year-error" : undefined}
              placeholder="Ví dụ: 2000" disabled={saving}
              className={`w-full rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none focus:ring-2 focus:ring-[#1E3A2F]/20 ${errors.birthYear ? "ring-2 ring-[#99462A]/40" : ""}`} />
            {errors.birthYear && <p id="profile-birth-year-error" className="vm-feedback text-xs text-[#99462A]">{errors.birthYear}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-activity-level" className="text-xs font-semibold tracking-[0.02em] text-[#424844]">Mức vận động</label>
            <select id="profile-activity-level" value={draft.activityLevel ?? ""} disabled={saving}
              onChange={event => updateField("activityLevel", isActivityLevel(event.target.value) ? event.target.value : null)}
              aria-describedby="profile-activity-help"
              className="w-full rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none focus:ring-2 focus:ring-[#1E3A2F]/20">
              <option value="">Chọn mức vận động</option>
              {ACTIVITY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
            <p id="profile-activity-help" className="text-xs leading-5 text-[#727974]">{selectedActivity
              ? `${selectedActivity.detail}. Hệ số: ×${selectedActivity.factor.toLocaleString(locale)}.`
              : "Chọn theo sinh hoạt và tập luyện thực tế của bạn."}</p>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#424844]">
            Cân nặng mục tiêu
            <div className="relative"><input type="text" inputMode="decimal" value={draft.goalWeightKg} disabled={saving} onChange={event => updateField("goalWeightKg", event.target.value)} placeholder="Ví dụ: 60" className="w-full rounded-xl bg-[#F5F3F0] px-4 py-2.5 pr-10 text-sm font-normal outline-none focus:ring-2 focus:ring-[#1E3A2F]/20" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#727974]">kg</span></div>
          </label>
        </div>

        {/* Row 2: Vegetarian Diet Type (full-width dropdown from API) */}
        <div className="mt-6 flex flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
            {t("Vegetarian Diet Type", "Kiểu ăn chay")}
          </label>
          <div ref={dietDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDietDropdown((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] py-3 pl-4 pr-10 text-left text-[15px] font-medium leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
            >
              <span>
                {currentDietType
                  ? `${formatDietTypeName(currentDietType.name, language)}${currentDietType.description ? ` (${currentDietType.description})` : ""}`
                  : t("Select diet type", "Chọn kiểu ăn chay")}
              </span>
              <svg
                width="8"
                height="15"
                viewBox="0 0 8 15"
                fill="none"
                className={`text-[#727974] transition ${showDietDropdown ? "rotate-180" : ""}`}
              >
                <path
                  d="M1 1L4.5 7.5L1 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showDietDropdown && (
              <div className="absolute left-0 top-full z-[1000] mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB] max-h-60 overflow-y-auto">
                {dietTypes.map((dt) => (
                  <button
                    key={dt.dietTypeId}
                    type="button"
                    onClick={() => {
                      updateField("dietTypeId", dt.dietTypeId);
                      setShowDietDropdown(false);
                    }}
                    className={`flex w-full flex-col px-4 py-3 text-left transition hover:bg-[#F5F3F0] ${
                      draft.dietTypeId === dt.dietTypeId ? "bg-[#F5F3F0]" : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        draft.dietTypeId === dt.dietTypeId
                          ? "font-semibold text-[#07241A]"
                          : "text-[#1B1C1A]"
                      }`}
                    >
                      {formatDietTypeName(dt.name, language)}
                    </span>
                    {dt.description && (
                      <span className="text-xs text-[#727974]">
                        {<UiText text={dt.description} />}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[13px] leading-5 text-[#727974]">
            {currentDietTypeExplanation}
          </p>
        </div>

        {/* BMI Panel */}
        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-[#F5F3F0] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CAEADA]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#032017"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
                  BMI: {bmi !== null ? bmi.toFixed(1) : "—"}
                </span>
                {bmiCategory && (
                  <>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1E3A2F]" />
                    <span
                      className="text-xs font-semibold tracking-[0.02em]"
                      style={{ color: bmiCategory.color }}
                    >
                      {<UiText text={bmiCategory.label} />}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[13px] leading-5 text-[#727974]">
                {bmi !== null
                  ? `Calculated automatically from your height (${draft.heightCm}cm) and weight (${draft.weightKg}kg).`
                  : ui("Enter valid height and weight to compute BMI.")}
              </span>
            </div>
          </div>

          {/* Visual indicator */}
          {bmi !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5">
              <span className="text-xs font-semibold tracking-[0.02em] text-[#727974]"><UiText text={"Cân bằng tối ưu"} /></span>
              <div className="flex h-2 w-20 overflow-hidden rounded-full bg-[#EFEEEB]">
                <div
                  className="h-full rounded-full bg-[#DBDAD7]"
                  style={{ width: "30%" }}
                />
                <div
                  className="h-full bg-[#AECEBE]"
                  style={{ width: "45%" }}
                />
                <div
                  className="h-full rounded-r-full bg-[#FFDBD0]"
                  style={{ width: "25%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Allergies & Intolerances */}
        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex flex-col">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]"><UiText text={"Dị ứng & không dung nạp"} /></label>
            <p className="text-[13px] leading-5 text-[#727974]"><UiText text={"VeggieMate sẽ cảnh báo hoặc bỏ qua món có các thành phần này."} /></p>
          </div>

          <p className="text-sm text-[#627369]">{t("Select allergens, then use Save allergens and confirm to update this selection separately.", "Chọn dị ứng, bấm Lưu dị ứng rồi xác nhận để cập nhật riêng lựa chọn này.")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {allAllergens.map(allergen => <label key={allergen.allergenId} className={`vm-button flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selectedAllergenIds.includes(allergen.allergenId) ? "border-[#80AA8D] bg-[#EAF5EE] text-[#163E2E]" : "border-[#E5E9E0] bg-white"}`}>
              <input type="checkbox" disabled={saving || allergenSaving} checked={selectedAllergenIds.includes(allergen.allergenId)} onChange={() => toggleAllergen(allergen.allergenId)} className="size-4 shrink-0 accent-[#163E2E]" />
              <span className="break-words">{allergen.name}</span>
            </label>)}
          </div>
          {allAllergens.length === 0 && <p className="text-sm text-[#727974]">{t("The allergen list is currently unavailable.", "Hiện chưa có danh sách dị ứng để chọn.")}</p>}
          <AllergenSelectionSave selectedIds={selectedAllergenIds} savedIds={savedAllergenIds} catalog={allAllergens} disabled={saving} onBusyChange={setAllergenSaving} onSaved={applySavedAllergens} />
          <AllergenRequestsPanel key={avatarOwner?.uid ?? "guest"} onCatalogChange={setAllAllergens} />
        </div>
      </section>

      {/* ═══ 5. LIVING LOCATION CARD ═══ */}
      <section id="living-location" className="vm-form-panel scroll-mt-28 flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              {t("Living Location", "Vị trí sinh sống")}
            </h2>
            <p className="text-[13px] leading-5 text-[#727974]">
              {t("Your home base coordinates for vegetarian restaurants, plant bistros, and nearby places.", "Tọa độ nơi ở của bạn để tìm nhà hàng chay, quán thuần thực vật và địa điểm gần đó.")}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3F0]">
            <svg
              width="12"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E3A2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>

        {/* Guidance Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#EFEEEB] p-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#CAEADA]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#032017"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <p className="text-[13px] leading-5 text-[#727974]">
            {t("Your location helps VeggieMate recommend vegetarian places near you in the Vegan Places Guide and filter neighborhood community dining tables.", "Vị trí của bạn giúp VeggieMate gợi ý địa điểm chay gần bạn trong Cẩm nang địa điểm chay và lọc các gợi ý ăn uống quanh khu vực.")}
            <br />
            <span className="text-[11px] italic">
              {t("Your selected address and coordinates are saved to help find nearby restaurants.", "Địa chỉ và tọa độ đã chọn sẽ được lưu để tìm nhà hàng gần bạn.")}
            </span>
          </p>
        </div>

        {/* Row 1: Province & Area dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableLocationSelect
            label={t("City / Province", "Tỉnh / Thành phố")}
            value={selectedProvinceCode}
            options={provinces}
            placeholder={t("Select province", "Chọn tỉnh/thành")}
            searchPlaceholder={t("Search province...", "Tìm tỉnh/thành...")}
            onSelect={(code) => void handleProvinceSelect(code)}
          />
          <SearchableLocationSelect
            label={t("District / Area", "Quận / Khu vực")}
            value={selectedAreaCode}
            options={areas}
            placeholder={selectedProvinceCode ? t("Select area", "Chọn khu vực") : t("Select province first", "Chọn tỉnh/thành trước")}
            searchPlaceholder={t("Search district / area...", "Tìm quận/khu vực...")}
            disabled={areas.length === 0}
            onSelect={(code) => {
              const area = areas.find((item) => item.code === code);
              if (area) void handleAreaSelect(area);
            }}
          />
        </div>

        {/* Row 2: Address search with suggestions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
            {t("Search Address", "Tìm địa chỉ")}
          </label>
          <div ref={addressSuggestionsRef} className="relative">
            <svg
              width="11"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#99462A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => handleAddressSearch(e.target.value)}
              onFocus={() => {
                if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
              }}
              className="w-full rounded-xl bg-[#F5F3F0] py-2.5 pl-11 pr-4 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
              placeholder={t("Type to search for an address...", "Nhập để tìm địa chỉ...")}
            />
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-[1000] mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                {addressSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddressSuggestionSelect(s)}
                    className="flex w-full px-4 py-2.5 text-left text-sm text-[#424844] transition hover:bg-[#F5F3F0]"
                  >
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCoords && (
            <p className="text-[11px] text-[#727974]">
              {t("Selected coordinates:", "Tọa độ đã chọn:")} {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </p>
          )}
        </div>

        <ProfileLeafletMap
          coordinates={selectedCoords}
          areaLabel={selectedArea?.name ?? selectedProvince?.name ?? "your area"}
        />
      </section>

      {/* ═══ 6. FORM ACTIONS ═══ */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving || allergenSaving}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold tracking-[0.01em] text-[#727974] transition hover:bg-[#F5F3F0] hover:text-[#07241A]"
        ><UiText text={"Hủy bỏ"} /></button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || allergenSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-6 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-[#1E3A2F] disabled:opacity-60"
        >
          {saving ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </svg><UiText text={"Đang lưu…"} /></>
          ) : (
            <>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg><UiText text={"Lưu thay đổi"} /></>
          )}
        </button>
      </div>
    </>
  );
}
