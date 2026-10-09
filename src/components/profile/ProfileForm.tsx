"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
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
  getAreas,
  getAddressSuggestions,
  reverseGeocode,
  type BackendUserProfile,
  type DietTypeItem,
  type AllergenItem,
  type ProvinceItem,
  type AreaItem,
  type AddressSuggestion,
  type UpdateProfilePayload,
} from "@/lib/profile-api";
import { getStoredToken } from "@/lib/auth";

// ─── Draft shape — only fields the backend actually supports ─────────────────

interface ProfileDraft {
  fullName: string;
  email: string;
  sex: "MALE" | "FEMALE" | null;
  heightCm: string; // kept as string for controlled input
  weightKg: string;
  dietTypeId: number | null;
}

interface ProfileErrors {
  fullName?: string;
  heightCm?: string;
  weightKg?: string;
}

function validateDraft(d: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!d.fullName.trim()) errors.fullName = "Full name is required.";
  const h = parseFloat(d.heightCm);
  if (d.heightCm !== "" && (isNaN(h) || h <= 0))
    errors.heightCm = "Enter a positive number.";
  const w = parseFloat(d.weightKg);
  if (d.weightKg !== "" && (isNaN(w) || w <= 0))
    errors.weightKg = "Enter a positive number.";
  return errors;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProfileForm() {
  // ── Core state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});

  // Profile draft
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: "",
    email: "",
    sex: null,
    heightCm: "",
    weightKg: "",
    dietTypeId: null,
  });
  const [savedDraft, setSavedDraft] = useState<ProfileDraft>({ ...draft });

  // Reference data from API
  const [dietTypes, setDietTypes] = useState<DietTypeItem[]>([]);
  const [allAllergens, setAllAllergens] = useState<AllergenItem[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([]);
  const [savedAllergenIds, setSavedAllergenIds] = useState<number[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);

  // Location state (local-only, backend doesn't persist province/area text)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // UI toggles
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  const [showSexDropdown, setShowSexDropdown] = useState(false);
  const [showAllergenDropdown, setShowAllergenDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const dietDropdownRef = useRef<HTMLDivElement>(null);
  const sexDropdownRef = useRef<HTMLDivElement>(null);
  const allergenDropdownRef = useRef<HTMLDivElement>(null);
  const provinceDropdownRef = useRef<HTMLDivElement>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const addressSuggestionsRef = useRef<HTMLDivElement>(null);

  // Avatar preview (local blob only — backend has no avatar field)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      setToastMessage("Please log in to view your profile.");
      return;
    }

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
          heightCm: profile.heightCm != null ? String(profile.heightCm) : "",
          weightKg: profile.weightKg != null ? String(profile.weightKg) : "",
          dietTypeId: profile.dietTypeId ?? null,
        };

        setDraft(d);
        setSavedDraft({ ...d });

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
          if (msg.includes("401")) {
            setToastMessage(
              "Session expired. Please log in again to load your profile.",
            );
          } else {
            console.error("Failed to load profile data", err);
            setToastMessage("Failed to load profile. Please try again.");
          }
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

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (dietDropdownRef.current && !dietDropdownRef.current.contains(t))
        setShowDietDropdown(false);
      if (sexDropdownRef.current && !sexDropdownRef.current.contains(t))
        setShowSexDropdown(false);
      if (allergenDropdownRef.current && !allergenDropdownRef.current.contains(t))
        setShowAllergenDropdown(false);
      if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(t))
        setShowProvinceDropdown(false);
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(t))
        setShowAreaDropdown(false);
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

  const currentDietType = dietTypes.find((d) => d.dietTypeId === draft.dietTypeId);

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
      setSelectedProvinceCode(code);
      setSelectedAreaCode("");
      setAreas([]);
      setShowProvinceDropdown(false);
      try {
        const areaList = await getAreas(code);
        setAreas(areaList);
      } catch (err) {
        console.error("Failed to load areas", err);
      }
    },
    [],
  );

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
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);
  }, []);

  const handleAddressSuggestionSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddressQuery(suggestion.label);
    setSelectedCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
    setShowAddressSuggestions(false);
  }, []);

  // ── Allergy toggle ───────────────────────────────────────────────────────
  const toggleAllergen = useCallback((id: number) => {
    setSelectedAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const removeAllergen = useCallback((id: number) => {
    setSelectedAllergenIds((prev) => prev.filter((x) => x !== id));
  }, []);

  // ── Avatar (local only) ──────────────────────────────────────────────────
  const handlePhotoChange = () => fileInputRef.current?.click();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setToastMessage("Please select a valid image file (JPG, PNG, GIF, WEBP).");
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setDraft({ ...savedDraft });
    setSelectedAllergenIds([...savedAllergenIds]);
    setErrors({});
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setToastMessage(null);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validationErrors = validateDraft(draft);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        fullName: draft.fullName,
        sex: draft.sex,
        heightCm: draft.heightCm ? parseFloat(draft.heightCm) : null,
        weightKg: draft.weightKg ? parseFloat(draft.weightKg) : null,
        dietTypeId: draft.dietTypeId,
        latitude: selectedCoords?.lat ?? null,
        longitude: selectedCoords?.lng ?? null,
      };

      const [updatedProfile] = await Promise.all([
        updateProfile(payload),
        updateUserAllergens(selectedAllergenIds),
      ]);

      const newDraft: ProfileDraft = {
        fullName: updatedProfile.fullName ?? "",
        email: updatedProfile.email ?? "",
        sex: updatedProfile.sex ?? null,
        heightCm:
          updatedProfile.heightCm != null
            ? String(updatedProfile.heightCm)
            : "",
        weightKg:
          updatedProfile.weightKg != null
            ? String(updatedProfile.weightKg)
            : "",
        dietTypeId: updatedProfile.dietTypeId ?? null,
      };

      setDraft(newDraft);
      setSavedDraft({ ...newDraft });
      setSavedAllergenIds([...selectedAllergenIds]);
      setErrors({});
      setToastMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Save failed", err);
      setToastMessage("Something went wrong. Your changes were not saved.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <svg className="h-8 w-8 animate-spin text-[#1E3A2F]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
        <span className="text-sm text-[#727974]">Loading profile…</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 max-w-sm animate-fade-in rounded-xl bg-[#07241A] px-5 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex-1">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ═══ 1. PAGE INTRODUCTION ═══ */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-[0.05em] uppercase text-[#727974]">
            Account &amp; Preferences
          </span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#99462A]" />
        </div>
        <h1 className="font-serif text-[40px] leading-[48px] font-medium tracking-[-0.025em] text-[#07241A]">
          My Profile
        </h1>
        <p className="max-w-[672px] text-[15px] leading-6 text-[#424844]">
          Manage your personal information, health details and living location
          to shape your seasonal table.
        </p>
      </section>

      {/* ═══ 2. PROFILE SUMMARY CARD ═══ */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#EFEEEB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt={draft.fullName || "Avatar"}
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
              {draft.fullName || "Your Name"}
            </h2>
            <span className="text-[13px] leading-5 text-[#727974]">
              {draft.email}
            </span>
          </div>
        </div>

        {/* Change Photo button */}
        <button
          type="button"
          onClick={handlePhotoChange}
          className="flex items-center gap-2 rounded-xl bg-[#F5F3F0] px-3.5 py-2 text-xs font-semibold tracking-[0.02em] text-[#1B1C1A] transition hover:bg-[#EFEEEB]"
          title="Avatar upload is not supported by the backend yet"
        >
          <svg
            width="13"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#727974"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Change Photo
        </button>
      </section>

      {/* ═══ 3. PERSONAL INFORMATION CARD ═══ */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              Personal Information
            </h2>
            <p className="text-[13px] leading-5 text-[#727974]">
              Used for recipe discussions, workshop confirmations, and community
              identity.
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Full Name
            </label>
            <input
              type="text"
              value={draft.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className={`rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20 ${
                errors.fullName ? "ring-2 ring-[#99462A]/40" : ""
              }`}
              placeholder="Your full name"
            />
            {errors.fullName && (
              <span className="text-xs text-[#99462A]">{errors.fullName}</span>
            )}
          </div>

          {/* Email Address (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Email Address
            </label>
            <input
              type="email"
              value={draft.email}
              readOnly
              className="rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#727974] outline-none cursor-not-allowed"
              title="Email cannot be changed"
            />
          </div>

          {/* Gender dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Gender
            </label>
            <div ref={sexDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSexDropdown((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
              >
                <span>
                  {draft.sex === "MALE"
                    ? "Male"
                    : draft.sex === "FEMALE"
                      ? "Female"
                      : "Not specified"}
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
                <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
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
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. HEALTH PROFILE CARD ═══ */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              Health Profile
            </h2>
            <p className="text-[13px] leading-5 text-[#727974]">
              Configures ingredient substitutions and nutrient balance in
              seasonal menus.
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

        {/* Row 1: Height, Weight */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Height */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Height
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
              <span className="text-xs text-[#99462A]">{errors.heightCm}</span>
            )}
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Weight
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
              <span className="text-xs text-[#99462A]">{errors.weightKg}</span>
            )}
          </div>
        </div>

        {/* Row 2: Vegetarian Diet Type (full-width dropdown from API) */}
        <div className="mt-6 flex flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
            Vegetarian Diet Type
          </label>
          <div ref={dietDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDietDropdown((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] py-3 pl-4 pr-10 text-left text-[15px] font-medium leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
            >
              <span>
                {currentDietType
                  ? `${currentDietType.name}${currentDietType.description ? ` (${currentDietType.description})` : ""}`
                  : "Select diet type"}
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
              <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB] max-h-60 overflow-y-auto">
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
                      {dt.name}
                    </span>
                    {dt.description && (
                      <span className="text-xs text-[#727974]">
                        {dt.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[13px] leading-5 text-[#727974]">
            Used to match recipes and personalize your meal plan.
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
                      {bmiCategory.label}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[13px] leading-5 text-[#727974]">
                {bmi !== null
                  ? `Calculated automatically from your height (${draft.heightCm}cm) and weight (${draft.weightKg}kg).`
                  : "Enter valid height and weight to compute BMI."}
              </span>
            </div>
          </div>

          {/* Visual indicator */}
          {bmi !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5">
              <span className="text-xs font-semibold tracking-[0.02em] text-[#727974]">
                Optimal Balance
              </span>
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
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Allergies &amp; Intolerances
            </label>
            <p className="text-[13px] leading-5 text-[#727974]">
              VeggieMate will flag or automatically omit dishes featuring these
              elements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Render selected allergens as chips */}
            {selectedAllergenIds.map((id) => {
              const allergen = allAllergens.find((a) => a.allergenId === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FFDBD0] px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#390B00]"
                >
                  {allergen?.name ?? `Allergen #${id}`}
                  <button
                    type="button"
                    onClick={() => removeAllergen(id)}
                    className="flex items-center justify-center text-[#390B00]/60 transition hover:text-[#390B00]"
                    aria-label={`Remove ${allergen?.name ?? ""}`}
                  >
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1 1l6 6M7 1l-6 6" />
                    </svg>
                  </button>
                </span>
              );
            })}

            {/* Add Allergy dropdown from API allergens */}
            <div ref={allergenDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAllergenDropdown((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-[#F5F3F0] px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#1B1C1A] transition hover:bg-[#EFEEEB]"
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M4 1v6M1 4h6" />
                </svg>
                Add Allergy
              </button>
              {showAllergenDropdown && (
                <div className="absolute left-0 top-full z-30 mt-1 w-52 max-h-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                  {allAllergens.length === 0 && (
                    <div className="px-4 py-3 text-xs text-[#727974]">
                      No allergens available
                    </div>
                  )}
                  {allAllergens.map((allergen) => {
                    const isSelected = selectedAllergenIds.includes(
                      allergen.allergenId,
                    );
                    return (
                      <button
                        key={allergen.allergenId}
                        type="button"
                        onClick={() => toggleAllergen(allergen.allergenId)}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-[#F5F3F0] ${
                          isSelected
                            ? "bg-[#FFDBD0]/30 font-semibold text-[#07241A]"
                            : "text-[#424844]"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-[#99462A] bg-[#99462A]"
                              : "border-[#DBDAD7]"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 5l2 2 4-4" />
                            </svg>
                          )}
                        </span>
                        {allergen.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. LIVING LOCATION CARD ═══ */}
      <section className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              Living Location
            </h2>
            <p className="text-[13px] leading-5 text-[#727974]">
              Your home base coordinates for organic markets, plant bistros, and
              localized seasonal harvest.
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
            Your location helps VeggieMate recommend vegetarian places near you
            in the{" "}
            <span className="font-semibold text-[#07241A]">
              Vegan Places Guide
            </span>{" "}
            and filter neighborhood community dining tables.
            <br />
            <span className="text-[11px] italic">
              Note: Province/area selections are used to find coordinates only — the backend does not store address text.
            </span>
          </p>
        </div>

        {/* Row 1: Province & Area dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Province */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              City / Province
            </label>
            <div ref={provinceDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowProvinceDropdown((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
              >
                <span className={selectedProvince ? "" : "text-[#727974]"}>
                  {selectedProvince?.name ?? "Select province"}
                </span>
                <svg
                  width="9"
                  height="6"
                  viewBox="0 0 9 6"
                  fill="none"
                  className={`text-[#727974] transition ${showProvinceDropdown ? "rotate-180" : ""}`}
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
              {showProvinceDropdown && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                  {provinces.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleProvinceSelect(p.code)}
                      className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#F5F3F0] ${
                        selectedProvinceCode === p.code
                          ? "bg-[#F5F3F0] font-semibold text-[#07241A]"
                          : "text-[#424844]"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              District / Area
            </label>
            <div ref={areaDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (areas.length > 0) setShowAreaDropdown((v) => !v);
                }}
                disabled={areas.length === 0}
                className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={selectedArea ? "" : "text-[#727974]"}>
                  {selectedArea?.name ?? (selectedProvinceCode ? "Select area" : "Select province first")}
                </span>
                <svg
                  width="9"
                  height="6"
                  viewBox="0 0 9 6"
                  fill="none"
                  className={`text-[#727974] transition ${showAreaDropdown ? "rotate-180" : ""}`}
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
              {showAreaDropdown && areas.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                  {areas.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        setSelectedAreaCode(a.code);
                        setShowAreaDropdown(false);
                        // Use area coordinates if available
                        if (a.latitude != null && a.longitude != null) {
                          setSelectedCoords({ lat: a.latitude, lng: a.longitude });
                        }
                      }}
                      className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#F5F3F0] ${
                        selectedAreaCode === a.code
                          ? "bg-[#F5F3F0] font-semibold text-[#07241A]"
                          : "text-[#424844]"
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Address search with suggestions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
            Search Address
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
              placeholder="Type to search for an address…"
            />
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
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
              Selected coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Map Preview Container */}
        <MapPreview
          provinceName={selectedProvince?.name}
          areaName={selectedArea?.name}
        />
      </section>

      {/* ═══ 6. FORM ACTIONS ═══ */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold tracking-[0.01em] text-[#727974] transition hover:bg-[#F5F3F0] hover:text-[#07241A]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
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
              </svg>
              Saving…
            </>
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
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ─── MapPreview sub-component ───────────────────────────────────────────────

/**
 * Map preview placeholder — ready for integration with a 3rd-party map provider.
 * Currently shows the Figma illustration image as a demo placeholder.
 *
 * TODO: Integrate with a map service (e.g. Mapbox, Google Maps) when API key is available.
 * This component does NOT request GPS permission or perform real geocoding.
 */
function MapPreview({
  provinceName,
  areaName,
}: {
  provinceName?: string;
  areaName?: string;
}) {
  const areaLabel =
    areaName && provinceName
      ? `${areaName}, ${provinceName}`
      : areaName || provinceName || "your area";

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-[#EAE8E5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
      {/* Figma illustration image — demo only */}
      <Image
        src="/images/map-preview.png"
        alt="Map preview (illustration only — not a live map)"
        fill
        className="object-cover"
      />

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07241A]/60 via-transparent to-transparent" />

      {/* Bottom-left pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] text-[#07241A] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <span className="inline-block h-2 w-2 rounded-full bg-[#99462A]" />
        <span>Active radius: 5.0 km around {areaLabel}</span>
      </div>

      {/* Top-right badge — demo illustration */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#07241A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="font-serif text-sm font-medium text-[#1B1C1A]">
          18 Plant Cafés nearby
        </span>
      </div>

      {/* Demo indicator */}
      <div className="absolute bottom-3 right-3 rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">
        Illustration only
      </div>
    </div>
  );
}
