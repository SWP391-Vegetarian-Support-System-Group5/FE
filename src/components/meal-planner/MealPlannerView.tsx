"use client";

import UiText, { useUiText } from "@/components/UiText";


import { useMealPlanner } from "./useMealPlanner";
import Link from "next/link";
import Image from "next/image";

export interface MealItem {
  id: string;
  recipeId?: number;
  mealPlanMealId?: number;
  slot: "BREAKFAST" | "LUNCH" | "DINNER";
  timeLabel: string;
  durationCalories: string;
  isSavedInCollection?: boolean;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  steps: string[];
}

export interface DayPlan {
  dayName: string;
  theme: string;
  totalPrep: string;
  meals: MealItem[];
}

export const INITIAL_DAYS: DayPlan[] = [
  {
    dayName: "Monday",
    theme: "Day 1 · Fresh Larder Start",
    totalPrep: "80 min total prep",
    meals: [
      {
        id: "m-mon-1",
        slot: "BREAKFAST",
        timeLabel: "Morning",
        durationCalories: "25 mins · 280 kcal",
        title: "Warm Tofu & Vegetable Congee",
        description:
          "Gentle broken rice infused with shaved fresh ginger, bok choy stems, and silken tofu cubs seasoned with white pepper.",
        image:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "150g Broken jasmine rice",
          "100g Silken tofu",
          "2 stalks Baby bok choy",
          "1 tsp Shaved fresh ginger",
          "Sesame oil & white pepper",
        ],
        steps: [
          "Simmer jasmine rice with vegetable stock until broken and velvety.",
          "Add diced silken tofu and sliced bok choy stems.",
          "Finish with ginger shreds, toasted sesame oil, and cilantro.",
        ],
      },
      {
        id: "m-mon-2",
        slot: "LUNCH",
        timeLabel: "Midday",
        durationCalories: "35 mins",
        isSavedInCollection: true,
        title: "Bún Bò Chay (Spicy Hue Broth)",
        description:
          "Lemongrass simmered root broth with thick round rice noodles, king oyster mushrooms, and crispy tofu puffs.",
        image:
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "200g Fresh thick rice noodles",
          "3 stalks Lemongrass",
          "100g King oyster mushrooms",
          "50g Fried tofu puffs",
          "Annatto oil, lime & fresh mint",
        ],
        steps: [
          "Bruise lemongrass stalks and simmer with daikon and pineapple core.",
          "Stir-fry king oyster mushrooms with annatto chili oil.",
          "Pour boiling broth over noodles and garnish with herbs.",
        ],
      },
      {
        id: "m-mon-3",
        slot: "DINNER",
        timeLabel: "Evening",
        durationCalories: "20 mins",
        isSavedInCollection: true,
        title: "Easy Tofu in Rich Tomato Sauce",
        description:
          "Quick pantry pan-fry with crushed vine tomatoes, finely sliced scallions, and warm steamed brown rice.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "300g Firm organic tofu",
          "3 Ripe vine tomatoes",
          "2 Scallions",
          "1 tbsp Tamari soy sauce",
          "1 tsp Cane sugar",
        ],
        steps: [
          "Pan-fry cubed tofu until light golden edges form.",
          "Simmer diced tomatoes into a velvety reduction with tamari.",
          "Toss tofu in tomato sauce and garnish with scallions.",
        ],
      },
    ],
  },
  {
    dayName: "Tuesday",
    theme: "Day 2 · Earth & Claypot",
    totalPrep: "65 min total prep",
    meals: [
      {
        id: "m-tue-1",
        slot: "BREAKFAST",
        timeLabel: "Morning",
        durationCalories: "15 mins · 310 kcal",
        title: "Avocado & Steamed Rice Paper Rolls",
        description:
          "Crisp mint leaves, julienned cucumber, creamy hass avocado with lightly seasoned peanut dipping sauce.",
        image:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "6 Sheets Vietnamese rice paper",
          "1 Ripe Hass avocado",
          "1 Persian cucumber",
          "Fresh mint & perilla leaves",
          "Peanut hoisin dip",
        ],
        steps: [
          "Dip rice paper briefly in lukewarm water.",
          "Layer avocado slices, cucumber strips, and fresh herbs.",
          "Roll tightly and serve immediately with peanut sauce.",
        ],
      },
      {
        id: "m-tue-2",
        slot: "LUNCH",
        timeLabel: "Midday",
        durationCalories: "30 mins",
        isSavedInCollection: true,
        title: "Claypot Braised Tofu & Eggplant",
        description:
          "Slow-caramelized Asian eggplant with cracked Kampot black pepper, garlic scallions, and silken claypot glaze.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "2 Asian purple eggplants",
          "200g Fried firm tofu",
          "2 tbsp Dark mushroom soy sauce",
          "1 tsp Coarse black pepper",
          "1 Red chili",
        ],
        steps: [
          "Sear eggplant slices in claypot until slightly charred.",
          "Add tofu, caramelized mushroom soy sauce, and 1/2 cup water.",
          "Simmer on low heat until sauce thickens and glazes eggplant.",
        ],
      },
      {
        id: "m-tue-3",
        slot: "DINNER",
        timeLabel: "Evening",
        durationCalories: "25 mins",
        isSavedInCollection: true,
        title: "Crispy Mushroom Spring Rolls with Vermicelli",
        description:
          "Shiitake and wood-ear mushroom filling served over chilled vermicelli noodles, fresh garden herbs, and lime dressing.",
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "10 Crispy spring roll wrappers",
          "100g Fresh shiitake & wood ear mushrooms",
          "150g Rice vermicelli",
          "Fresh lettuce & herbs",
          "Sweet & sour lime dipping dressing",
        ],
        steps: [
          "Roll mushroom filling in wrappers and air fry at 190°C for 12 mins.",
          "Cook rice vermicelli and drain in cold water.",
          "Assemble rolls over vermicelli bed and drizzle dressing.",
        ],
      },
    ],
  },
];

export const ALTERNATIVE_DISHES: Record<string, Partial<MealItem>> = {
  BREAKFAST: {
    title: "Toasted Sourdough with Edamame Herb Mash",
    description: "Lemony crushed green soybeans, extra virgin olive oil, and toasted coriander seeds.",
    durationCalories: "15 mins · 290 kcal",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  },
  LUNCH: {
    title: "Garlic Bok Choy & Glass Noodle Tangle",
    description: "Wok-tossed farm greens with ginger, light tamari, and toasted sesame crunch.",
    durationCalories: "20 mins · 340 kcal",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  },
  DINNER: {
    title: "Kabocha Pumpkin & Coconut Gentle Curry",
    description: "Sweet squash simmered with light coconut nectar, turmeric, and crisp long beans.",
    durationCalories: "30 mins · 390 kcal",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80",
  },
};

export default function MealPlannerView() {
  const ui = useUiText();
  const {
    days, allergens, newAllergen, setNewAllergen, showAddAllergen, setShowAddAllergen,
    pantryIngredients, newPantryItem, setNewPantryItem, selectedMealForView, setSelectedMealForView,
    toastMessage, isRegenerating, handleRemoveAllergen, handleAddAllergen, handleRemovePantry,
    handleAddPantry, handleReplaceMeal, handleRegenerate, viewMeal, profileName, bmi, bmiCategory,
    dietName, savedCount, loading, error, startDate, setStartDate,
  } = useMealPlanner();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#07241A] px-5 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-fade-in flex items-center gap-2">
          <span>🌿</span>
          <span>{<UiText text={toastMessage} />}</span>
        </div>
      )}

      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#EFEEEB] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#727974]">
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
            <span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[11px] font-bold text-[#07241A]">{ui("Weekly meal plan")}</span>
          </div>

          <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#07241A]"><UiText text={"Plan My Week"} /></h1>
          <p className="mt-1.5 text-sm text-[#424844] max-w-2xl">{ui("Meals selected for your ingredients, vegetarian type and BMI group.")}</p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || loading}
            className="flex items-center gap-2 rounded-xl bg-white border border-[#EFEEEB] px-4 py-2.5 text-xs font-semibold text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition cursor-pointer"
          >
            <span>✨</span>
            <span>{isRegenerating ? ui("Đang tạo lại...") : ui("Regenerate Plan")}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title={ui("In thực đơn")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#EFEEEB] text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition cursor-pointer"
          >
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
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
          </button>
        </div>
      </div>

      {loading && <p role="status" className="py-4">{ui("Loading...")}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loading && days.length === 0 && <p className="py-4">{ui("No meal plan yet.")}</p>}
      <label className="mt-4 block text-sm">{ui("Start date")} <input type="text" inputMode="numeric" placeholder="dd/mm/yy" maxLength={10} value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-3 w-36 rounded-lg border p-2" /></label>
      {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* =============================================================== */}
        {/* Left Column: Profile, Larder & Pantry Utilization (4 cols)      */}
        {/* =============================================================== */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: User Profile & Goals */}
          <div className="rounded-3xl bg-white p-6 border border-[#EFEEEB] shadow-xs space-y-5">
            {/* User Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07241A] font-serif text-lg font-bold text-white shadow-xs">
                  {profileName.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#07241A]">
                    {profileName}
                  </h3>
                  <p className="text-[11px] text-[#727974]">{dietName}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#FDE8E4] px-2.5 py-0.5 text-[10px] font-bold text-[#99462A]">{bmiCategory}</span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#FBF9F6] p-3.5 border border-[#EFEEEB]">
              <div>
                <span className="text-[11px] font-medium text-[#727974]"><UiText text={"Body Tempo"} /></span>
                <p className="mt-0.5 text-xs font-bold text-[#07241A]">
                  {bmi ?? ui("Not available")}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#727974]">BMI</span>
                <p className="mt-0.5 text-xs font-bold text-[#99462A]">{bmiCategory}</p>
              </div>
            </div>

            {/* Avoiding Allergens */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider text-[11px] text-[#727974] uppercase"><UiText text={"AVOIDING ALLERGENS"} /></span>
                <button
                  type="button"
                  onClick={() => setShowAddAllergen(!showAddAllergen)}
                  className="font-semibold text-xs text-[#07241A] hover:text-[#1E3A2F] cursor-pointer"
                ><UiText text={"+ Add"} /></button>
              </div>

              {/* Add allergen inline form */}
              {showAddAllergen && (
                <form onSubmit={handleAddAllergen} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    placeholder={ui("Tên chất dị ứng...")}
                    className="flex-1 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white"
                  ><UiText text={"Lưu"} /></button>
                </form>
              )}

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((alg) => (
                  <span
                    key={alg}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3F0] px-3 py-1 text-xs text-[#424844] border border-[#EFEEEB]"
                  >
                    <span>{alg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergen(alg)}
                      className="text-[#727974] hover:text-red-600 transition"
                      title={ui("Gỡ dị ứng")}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Link to Saved Recipes */}
            <Link
              href="/bookmarks"
              className="flex items-center justify-between rounded-2xl bg-[#E8F1EC] p-3 text-xs font-semibold text-[#07241A] transition hover:bg-[#D9E6DC]"
            >
              <div className="flex items-center gap-2">
                <span>🔖</span>
                <span>{savedCount} {ui("Saved recipes")}</span>
              </div>
              <span>→</span>
            </Link>
          </div>

          {/* Card 2: Larder & Fresh Bin */}
          <div className="rounded-3xl bg-white p-6 border border-[#EFEEEB] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#07241A]"><UiText text={"Larder & Fresh Bin"} /></h3>
                <p className="text-[11px] text-[#727974]"><UiText text={"Used first to prevent culinary waste"} /></p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFEEEB] text-xs font-bold text-[#07241A]">
                {pantryIngredients.length}
              </span>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {pantryIngredients.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8F1EC] px-3 py-1.5 text-xs font-medium text-[#07241A] border border-[#D9E6DC]"
                >
                  <span>{<UiText text={item} />}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePantry(item)}
                    className="text-[#727974] hover:text-red-600 transition"
                    title={ui("Xóa nguyên liệu")}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Add ingredient input */}
            <form onSubmit={handleAddPantry} className="flex gap-2">
              <input
                type="text"
                value={newPantryItem}
                onChange={(e) => setNewPantryItem(e.target.value)}
                placeholder={ui("Add pantry staple (e.g., Lemongrass)")}
                className="flex-1 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none placeholder:text-[#727974] focus:border-[#1E3A2F]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#F5F3F0] border border-[#EFEEEB] px-3 py-2 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/50 cursor-pointer"
              ><UiText text={"+ Add"} /></button>
            </form>

            <p className="text-[11px] text-[#727974] italic">{ui("Available ingredients")}</p>

            {/* Big Action Button */}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07241A] py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] cursor-pointer"
            >
              <span>⚡</span>
              <span><UiText text={"Generate My 7-Day Plan"} /></span>
            </button>
          </div>

          {/* Card 3: Pantry Utilization */}
          <div className="rounded-3xl bg-[#FBF9F6] p-5 border border-[#EFEEEB] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#07241A]">
              <span>🥕</span>
              <span>{pantryIngredients.length} {ui("Available ingredients")}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#727974]">{dietName}</p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* Right Column: Daily Plans & Cards (8 cols)                      */}
        {/* =============================================================== */}
        <div className="space-y-8 lg:col-span-8">
          {days.map((day, dIdx) => (
            <section key={day.dayName} className="space-y-4">
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <h2 className="font-serif text-2xl font-bold text-[#07241A]">
                    {<UiText text={day.dayName} />}
                  </h2>
                  <span className="text-sm text-[#727974]">
                    {<UiText text={day.theme} />}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#727974] flex items-center gap-1">
                  <span>⏱</span>
                  <span>{<UiText text={day.totalPrep} />}</span>
                </span>
              </div>

              {/* Meals list */}
              <div className="space-y-3">
                {day.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white p-4 sm:p-5 border border-[#EFEEEB] shadow-xs transition hover:border-[#1E3A2F]"
                  >
                    <div className="flex items-center gap-4">
                      {/* Dish Photo */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#EFEEEB]">
                        <Image
                          src={meal.image || "/images/hero_slide.png"}
                          alt={meal.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.2 text-[9px] font-semibold text-white">
                          {<UiText text={meal.timeLabel} />}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                            {<UiText text={meal.slot} />}
                          </span>
                          <span className="text-xs text-[#727974]">·</span>
                          <span className="text-[11px] font-medium text-[#727974]">
                            {<UiText text={meal.durationCalories} />}
                          </span>
                          {meal.isSavedInCollection && (
                            <span className="rounded-full bg-[#FDE8E4] px-2 py-0.2 text-[10px] font-semibold text-[#99462A]"><UiText text={"Saved in Collection"} /></span>
                          )}
                        </div>

                        <h3 className="font-serif text-base font-bold text-[#07241A]">
                          {<UiText text={meal.title} />}
                        </h3>
                        <p className="text-xs text-[#727974] line-clamp-1 max-w-md">
                          {<UiText text={meal.description} />}
                        </p>
                      </div>
                    </div>

                    {/* Meal actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => viewMeal(meal)}
                        className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-white hover:shadow-xs transition cursor-pointer"
                      ><UiText text={"View Recipe"} /></button>
                      <button
                        type="button"
                        disabled={isRegenerating} onClick={() => handleReplaceMeal(dIdx, meal.id, meal.slot)}
                        className="flex items-center gap-1 rounded-xl bg-white border border-[#EFEEEB] px-3 py-1.5 text-xs font-semibold text-[#727974] hover:text-[#07241A] hover:bg-[#F5F3F0] transition cursor-pointer"
                      >
                        <span>🔄</span>
                        <span><UiText text={"Replace"} /></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}


        </div>
      </div>

      {/* ── View Recipe Modal ───────────────────────────────────────────── */}
      {selectedMealForView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedMealForView(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative aspect-video w-full bg-[#EFEEEB]">
              <Image
                src={selectedMealForView.image || "/images/hero_slide.png"}
                alt={selectedMealForView.title}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setSelectedMealForView(null)}
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#99462A]">
                  {<UiText text={selectedMealForView.slot} />} · {<UiText text={selectedMealForView.durationCalories} />}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#07241A]">
                  {<UiText text={selectedMealForView.title} />}
                </h3>
                <p className="mt-1 text-xs text-[#727974] leading-relaxed">
                  {<UiText text={selectedMealForView.description} />}
                </p>
              </div>

              {/* Ingredients */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]"><UiText text={"🥗 Nguyên liệu cần chuẩn bị:"} /></h4>
                <ul className="list-disc pl-5 text-xs text-[#424844] space-y-1">
                  {selectedMealForView.ingredients.map((ing, i) => (
                    <li key={i}>{<UiText text={ing} />}</li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]"><UiText text={"🍳 Hướng dẫn chế biến:"} /></h4>
                <ol className="list-decimal pl-5 text-xs text-[#424844] space-y-1.5">
                  {selectedMealForView.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>

              <div className="pt-2 border-t border-[#EFEEEB] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMealForView(null)}
                  className="rounded-xl bg-[#07241A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1E3A2F]"
                ><UiText text={"Đóng"} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
