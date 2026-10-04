"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  ProfileData,
  ProfileErrors,
  DEMO_PROFILE,
  DIET_TYPE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  computeBmi,
  classifyBmi,
} from "@/types/profile";

// ─── Helpers ────────────────────────────────────────────────────────────────

function validateProfile(data: ProfileData): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  const h = parseFloat(data.heightCm);
  if (data.heightCm !== "" && (isNaN(h) || h <= 0)) {
    errors.heightCm = "Enter a positive number.";
  }

  const w = parseFloat(data.weightKg);
  if (data.weightKg !== "" && (isNaN(w) || w <= 0)) {
    errors.weightKg = "Enter a positive number.";
  }

  return errors;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProfileForm() {
  // ── State: saved vs. draft ───────────────────────────────────────────────
  const [savedProfile, setSavedProfile] = useState<ProfileData>({
    ...DEMO_PROFILE,
  });
  const [draft, setDraft] = useState<ProfileData>({ ...DEMO_PROFILE });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Avatar preview (blob URL during editing, null otherwise)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allergy add popover
  const [showAllergyInput, setShowAllergyInput] = useState(false);
  const [allergyInputValue, setAllergyInputValue] = useState("");
  const allergyInputRef = useRef<HTMLInputElement>(null);

  // Diet dropdown
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  const dietDropdownRef = useRef<HTMLDivElement>(null);

  // Health goal dropdown
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const goalDropdownRef = useRef<HTMLDivElement>(null);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dietDropdownRef.current &&
        !dietDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDietDropdown(false);
      }
      if (
        goalDropdownRef.current &&
        !goalDropdownRef.current.contains(e.target as Node)
      ) {
        setShowGoalDropdown(false);
      }
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

  // ── Derived: BMI ─────────────────────────────────────────────────────────
  const bmi = computeBmi(draft.heightCm, draft.weightKg);
  const bmiCategory = bmi !== null ? classifyBmi(bmi) : null;

  // ── Field updater ────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ProfileErrors];
        return next;
      });
    },
    []
  );

  // ── Avatar handlers ──────────────────────────────────────────────────────
  const handlePhotoChange = () => fileInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setToastMessage("Please select a valid image file (JPG, PNG, GIF, WEBP).");
      return;
    }

    // Revoke previous blob URL
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    // Reset input so re-selecting the same file still triggers onChange
    e.target.value = "";
  };

  // ── Allergy handlers ─────────────────────────────────────────────────────
  const addAllergy = () => {
    const trimmed = allergyInputValue.trim();
    if (!trimmed) return;

    const isDuplicate = draft.allergies.some(
      (a) => a.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        allergies: `"${trimmed}" is already added.`,
      }));
      return;
    }

    updateField("allergies", [...draft.allergies, trimmed]);
    setAllergyInputValue("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.allergies;
      return next;
    });
  };

  const removeAllergy = (allergyToRemove: string) => {
    updateField(
      "allergies",
      draft.allergies.filter((a) => a !== allergyToRemove)
    );
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setDraft({ ...savedProfile });
    setErrors({});
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setShowAllergyInput(false);
    setAllergyInputValue("");
    setToastMessage(null);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validationErrors = validateProfile(draft);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      // Mock service: simulates a 600ms network delay
      // TODO: Replace with real API call when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 600));

      const profileToSave = { ...draft };
      // Note: avatar blob URL is a preview only — not uploaded to server
      if (avatarPreview) {
        // In a real implementation, this would be the URL returned by the upload API
        profileToSave.avatarUrl = avatarPreview;
      }

      setSavedProfile(profileToSave);
      setDraft(profileToSave);
      // Keep avatarPreview as-is since it becomes the "saved" state for this session
      setErrors({});
      setToastMessage("Demo changes applied for this session only.");
    } catch {
      setToastMessage("Something went wrong. Your changes were not saved.");
    } finally {
      setSaving(false);
    }
  };

  // ── Current diet label ───────────────────────────────────────────────────
  const currentDiet = DIET_TYPE_OPTIONS.find((d) => d.value === draft.dietType);
  const currentGoal = HEALTH_GOAL_OPTIONS.find(
    (g) => g.value === draft.healthGoal
  );

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
            <Image
              src={avatarPreview ?? draft.avatarUrl ?? "/images/avatar-demo.png"}
              alt={draft.fullName}
              fill
              className="object-cover"
              unoptimized={!!avatarPreview}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-[22px] leading-7 font-semibold text-[#07241A]">
              {draft.fullName || "Your Name"}
            </h2>
            <span className="text-[13px] leading-5 text-[#727974]">
              {draft.email} · Member since {draft.memberSince}
            </span>
            <p className="mt-0.5 font-serif text-sm italic leading-5 text-[#424844]">
              {draft.bio}
            </p>
          </div>
        </div>

        {/* Change Photo button */}
        <button
          type="button"
          onClick={handlePhotoChange}
          className="flex items-center gap-2 rounded-xl bg-[#F5F3F0] px-3.5 py-2 text-xs font-semibold tracking-[0.02em] text-[#1B1C1A] transition hover:bg-[#EFEEEB]"
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

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Email Address
            </label>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={`rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20 ${
                errors.email ? "ring-2 ring-[#99462A]/40" : ""
              }`}
              placeholder="you@email.com"
            />
            {errors.email && (
              <span className="text-xs text-[#99462A]">{errors.email}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Phone Number
            </label>
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
              placeholder="+84 xxx xxx xxx"
            />
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

        {/* Row 1: Height, Weight, Health Goal */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Health Goal dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              Health Goal
            </label>
            <div ref={goalDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowGoalDropdown((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20"
              >
                <span>{currentGoal?.label ?? "Select goal"}</span>
                <svg
                  width="9"
                  height="6"
                  viewBox="0 0 9 6"
                  fill="none"
                  className={`text-[#727974] transition ${showGoalDropdown ? "rotate-180" : ""}`}
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
              {showGoalDropdown && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                  {HEALTH_GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        updateField("healthGoal", opt.value);
                        setShowGoalDropdown(false);
                      }}
                      className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#F5F3F0] ${
                        draft.healthGoal === opt.value
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

        {/* Row 2: Vegetarian Diet Type (full-width dropdown) */}
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
                {currentDiet
                  ? `${currentDiet.label} (${currentDiet.description})`
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
              <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
                {DIET_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateField("dietType", opt.value);
                      setShowDietDropdown(false);
                    }}
                    className={`flex w-full flex-col px-4 py-3 text-left transition hover:bg-[#F5F3F0] ${
                      draft.dietType === opt.value
                        ? "bg-[#F5F3F0]"
                        : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        draft.dietType === opt.value
                          ? "font-semibold text-[#07241A]"
                          : "text-[#1B1C1A]"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-[#727974]">
                      {opt.description}
                    </span>
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

          {/* Visual indicator — demo-only static visualization */}
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
              <span className="text-xs font-semibold tracking-[0.02em] text-[#07241A]">
                {/* Demo illustration value — not a computed metric */}
                68%
              </span>
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
            {draft.allergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFDBD0] px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#390B00]"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(allergy)}
                  className="flex items-center justify-center text-[#390B00]/60 transition hover:text-[#390B00]"
                  aria-label={`Remove ${allergy}`}
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
            ))}

            {/* Add Allergy button / input */}
            {showAllergyInput ? (
              <div className="relative">
                <input
                  ref={allergyInputRef}
                  type="text"
                  value={allergyInputValue}
                  onChange={(e) => {
                    setAllergyInputValue(e.target.value);
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.allergies;
                      return next;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAllergy();
                    }
                    if (e.key === "Escape") {
                      setShowAllergyInput(false);
                      setAllergyInputValue("");
                    }
                  }}
                  placeholder="Type allergy name…"
                  className="w-40 rounded-full bg-[#F5F3F0] px-3 py-1 text-xs text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowAllergyInput(true);
                  setTimeout(() => allergyInputRef.current?.focus(), 50);
                }}
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
            )}
          </div>
          {errors.allergies && (
            <span className="text-xs text-[#99462A]">{errors.allergies}</span>
          )}
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
          </p>
        </div>

        {/* Row 1: City & District */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              City / Province
            </label>
            <div className="relative">
              <input
                type="text"
                value={draft.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full rounded-xl bg-[#F5F3F0] px-4 py-2.5 pr-10 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
                placeholder="Enter city or province"
              />
              <svg
                width="9"
                height="6"
                viewBox="0 0 9 6"
                fill="none"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727974]"
              >
                <path
                  d="M1 1L4.5 4.5L8 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
              District / Area
            </label>
            <div className="relative">
              <input
                type="text"
                value={draft.district}
                onChange={(e) => updateField("district", e.target.value)}
                className="w-full rounded-xl bg-[#F5F3F0] px-4 py-2.5 pr-10 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
                placeholder="Enter district or area"
              />
              <svg
                width="9"
                height="6"
                viewBox="0 0 9 6"
                fill="none"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727974]"
              >
                <path
                  d="M1 1L4.5 4.5L8 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Row 2: Living Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
            Living Address
          </label>
          <div className="relative">
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
              value={draft.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full rounded-xl bg-[#F5F3F0] py-2.5 pl-11 pr-4 text-[15px] leading-6 text-[#1B1C1A] outline-none transition placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
              placeholder="Enter your street address"
            />
          </div>
        </div>

        {/* Map Preview Container */}
        <MapPreview
          city={draft.city}
          district={draft.district}
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
function MapPreview({ city, district }: { city: string; district: string }) {
  // Derive a display string for the radius label
  const areaLabel =
    district && city ? `${district}, ${city}` : district || city || "your area";

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
