"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface MealItem {
  id: string;
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

interface DayPlan {
  dayName: string;
  theme: string;
  totalPrep: string;
  meals: MealItem[];
}

const INITIAL_DAYS: DayPlan[] = [
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

const ALTERNATIVE_DISHES: Record<string, Partial<MealItem>> = {
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
  const [days, setDays] = useState<DayPlan[]>(INITIAL_DAYS);
  const [allergens, setAllergens] = useState<string[]>([
    "Peanuts",
    "Dairy",
    "Egg White",
  ]);
  const [newAllergen, setNewAllergen] = useState("");
  const [showAddAllergen, setShowAddAllergen] = useState(false);

  const [pantryIngredients, setPantryIngredients] = useState<string[]>([
    "Pressed Tofu",
    "Vine Tomatoes",
    "King Oyster Mushrooms",
    "Baby Bok Choy",
  ]);
  const [newPantryItem, setNewPantryItem] = useState("");

  const [isWednesdayOpen, setIsWednesdayOpen] = useState(false);
  const [selectedMealForView, setSelectedMealForView] = useState<MealItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add / remove allergen
  const handleRemoveAllergen = (item: string) => {
    setAllergens((prev) => prev.filter((a) => a !== item));
    showToast(`Đã gỡ dị ứng "${item}".`);
  };

  const handleAddAllergen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergen.trim()) return;
    setAllergens((prev) => [...prev, newAllergen.trim()]);
    setNewAllergen("");
    setShowAddAllergen(false);
    showToast(`Đã thêm dị ứng "${newAllergen.trim()}".`);
  };

  // Add / remove pantry item
  const handleRemovePantry = (item: string) => {
    setPantryIngredients((prev) => prev.filter((p) => p !== item));
    showToast(`Đã bỏ nguyên liệu "${item}".`);
  };

  const handleAddPantry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPantryItem.trim()) return;
    setPantryIngredients((prev) => [...prev, newPantryItem.trim()]);
    setNewPantryItem("");
    showToast(`Đã thêm "${newPantryItem.trim()}" vào kho nguyên liệu!`);
  };

  // Replace a meal
  const handleReplaceMeal = (dayIndex: number, mealId: string, slot: "BREAKFAST" | "LUNCH" | "DINNER") => {
    const alt = ALTERNATIVE_DISHES[slot];
    setDays((prev) =>
      prev.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        return {
          ...day,
          meals: day.meals.map((m) => {
            if (m.id !== mealId) return m;
            return {
              ...m,
              title: alt.title || m.title,
              description: alt.description || m.description,
              durationCalories: alt.durationCalories || m.durationCalories,
              image: alt.image || m.image,
              isSavedInCollection: false,
            };
          }),
        };
      })
    );
    showToast(`Đã đổi món ăn bữa ${slot} thành "${alt.title}"!`);
  };

  // Regenerate plan
  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      showToast("VeggieAI đã lên lại kế hoạch thực đơn 7 ngày dựa trên nguyên liệu của bạn!");
    }, 900);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#07241A] px-5 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-fade-in flex items-center gap-2">
          <span>🌿</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#EFEEEB] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#727974]">
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
            <span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[11px] font-bold text-[#07241A]">
              Week 14 · Autumn Nourishment Table
            </span>
          </div>

          <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#07241A]">
            Plan My Week
          </h1>
          <p className="mt-1.5 text-sm text-[#424844] max-w-2xl">
            A bespoke vegetarian harvest tailored to Minh's pantry, thoughtful routines, and curated recipe collection.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 rounded-xl bg-white border border-[#EFEEEB] px-4 py-2.5 text-xs font-semibold text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition cursor-pointer"
          >
            <span>✨</span>
            <span>{isRegenerating ? "Đang tạo lại..." : "Regenerate Plan"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title="In thực đơn"
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
                  M
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#07241A]">
                    Minh Tran
                  </h3>
                  <p className="text-[11px] text-[#727974]">
                    Intentional Eater · Hanoi Studio
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#FDE8E4] px-2.5 py-0.5 text-[10px] font-bold text-[#99462A]">
                Gentle Cut
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#FBF9F6] p-3.5 border border-[#EFEEEB]">
              <div>
                <span className="text-[11px] font-medium text-[#727974]">
                  Body Tempo
                </span>
                <p className="mt-0.5 text-xs font-bold text-[#07241A]">
                  22.5 <span className="font-normal text-[#727974]">Norm</span>
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#727974]">
                  Focus
                </span>
                <p className="mt-0.5 text-xs font-bold text-[#99462A]">
                  Weight Loss
                </p>
              </div>
            </div>

            {/* Avoiding Allergens */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider text-[11px] text-[#727974] uppercase">
                  AVOIDING ALLERGENS
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAllergen(!showAddAllergen)}
                  className="font-semibold text-xs text-[#07241A] hover:text-[#1E3A2F] cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Add allergen inline form */}
              {showAddAllergen && (
                <form onSubmit={handleAddAllergen} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    placeholder="Tên chất dị ứng..."
                    className="flex-1 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Lưu
                  </button>
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
                      title="Gỡ dị ứng"
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
                <span>12 Saved Recipes in Box</span>
              </div>
              <span>→</span>
            </Link>
          </div>

          {/* Card 2: Larder & Fresh Bin */}
          <div className="rounded-3xl bg-white p-6 border border-[#EFEEEB] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#07241A]">
                  Larder &amp; Fresh Bin
                </h3>
                <p className="text-[11px] text-[#727974]">
                  Used first to prevent culinary waste
                </p>
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
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePantry(item)}
                    className="text-[#727974] hover:text-red-600 transition"
                    title="Xóa nguyên liệu"
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
                placeholder="Add pantry staple (e.g., Lemongrass)"
                className="flex-1 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none placeholder:text-[#727974] focus:border-[#1E3A2F]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#F5F3F0] border border-[#EFEEEB] px-3 py-2 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/50 cursor-pointer"
              >
                + Add
              </button>
            </form>

            <p className="text-[11px] text-[#727974] italic">
              AI prioritizes these ingredients in Monday &amp; Tuesday courses.
            </p>

            {/* Big Action Button */}
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07241A] py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] cursor-pointer"
            >
              <span>⚡</span>
              <span>Generate My 7-Day Plan</span>
            </button>
          </div>

          {/* Card 3: Pantry Utilization */}
          <div className="rounded-3xl bg-[#FBF9F6] p-5 border border-[#EFEEEB] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#07241A]">
              <span>🥕</span>
              <span>Pantry Utilization: 84%</span>
            </div>
            <p className="text-xs leading-relaxed text-[#727974]">
              By prioritizing your tofu and mushrooms within 48 hours, you avoid food waste while staying aligned with your light deficit.
            </p>
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
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-serif text-2xl font-bold text-[#07241A]">
                    {day.dayName}
                  </h2>
                  <span className="text-xs text-[#727974]">
                    {day.theme}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#727974] flex items-center gap-1">
                  <span>⏱</span>
                  <span>{day.totalPrep}</span>
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
                          src={meal.image}
                          alt={meal.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.2 text-[9px] font-semibold text-white">
                          {meal.timeLabel}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                            {meal.slot}
                          </span>
                          <span className="text-xs text-[#727974]">·</span>
                          <span className="text-[11px] font-medium text-[#727974]">
                            {meal.durationCalories}
                          </span>
                          {meal.isSavedInCollection && (
                            <span className="rounded-full bg-[#FDE8E4] px-2 py-0.2 text-[10px] font-semibold text-[#99462A]">
                              Saved in Collection
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-base font-bold text-[#07241A]">
                          {meal.title}
                        </h3>
                        <p className="text-xs text-[#727974] line-clamp-1 max-w-md">
                          {meal.description}
                        </p>
                      </div>
                    </div>

                    {/* Meal actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMealForView(meal)}
                        className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-white hover:shadow-xs transition cursor-pointer"
                      >
                        View Recipe
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplaceMeal(dIdx, meal.id, meal.slot)}
                        className="flex items-center gap-1 rounded-xl bg-white border border-[#EFEEEB] px-3 py-1.5 text-xs font-semibold text-[#727974] hover:text-[#07241A] hover:bg-[#F5F3F0] transition cursor-pointer"
                      >
                        <span>🔄</span>
                        <span>Replace</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* ── Wednesday Collapsible Accordion ───────────────────────────── */}
          <section className="rounded-3xl bg-white border border-[#EFEEEB] p-5 shadow-xs space-y-4">
            <button
              type="button"
              onClick={() => setIsWednesdayOpen(!isWednesdayOpen)}
              className="flex w-full items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-serif text-2xl font-bold text-[#07241A]">
                  Wednesday
                </h2>
                <span className="text-xs text-[#727974]">
                  Day 3 · Clean Greens &amp; Broths
                </span>
              </div>
              <span className="rounded-full bg-[#EFEEEB] px-3 py-1 text-xs font-semibold text-[#07241A] flex items-center gap-1.5">
                <span>3 Dishes Planned</span>
                <span className={`transition-transform ${isWednesdayOpen ? "rotate-180" : ""}`}>
                  ⌵
                </span>
              </span>
            </button>

            {isWednesdayOpen && (
              <div className="space-y-3 pt-2 border-t border-[#EFEEEB] animate-fade-in">
                <div className="flex items-center justify-between rounded-2xl bg-[#FBF9F6] p-4 text-xs">
                  <div>
                    <span className="font-bold uppercase text-[10px] text-[#727974]">
                      BREAKFAST · 15 MINS
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#07241A] mt-0.5">
                      Toasted Sourdough with Edamame Herb Mash
                    </h4>
                    <p className="text-[11px] text-[#727974]">
                      Lemony crushed green soybeans, olive oil, and toasted coriander seeds.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMealForView({
                          id: "m-wed-1",
                          slot: "BREAKFAST",
                          timeLabel: "Morning",
                          durationCalories: "15 mins",
                          title: "Toasted Sourdough with Edamame Herb Mash",
                          description: "Lemony crushed green soybeans with herbs.",
                          image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
                          ingredients: ["2 Slices sourdough", "100g Shelled edamame", "Fresh mint, lemon juice"],
                          steps: ["Toast sourdough.", "Mash warm edamame with lemon & oil.", "Spread and garnish."],
                        })
                      }
                      className="px-3 py-1 font-semibold text-[#07241A] hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Đã đổi món thứ 4!")}
                      className="px-3 py-1 font-semibold text-[#727974] hover:text-[#07241A]"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#FBF9F6] p-4 text-xs">
                  <div>
                    <span className="font-bold uppercase text-[10px] text-[#727974]">
                      LUNCH · 20 MINS
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#07241A] mt-0.5">
                      Garlic Bok Choy &amp; Glass Noodle Tangle
                    </h4>
                    <p className="text-[11px] text-[#727974]">
                      Wok-tossed farm greens with ginger, light tamari, and roasted sesame.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMealForView({
                          id: "m-wed-2",
                          slot: "LUNCH",
                          timeLabel: "Midday",
                          durationCalories: "20 mins",
                          title: "Garlic Bok Choy & Glass Noodle Tangle",
                          description: "Wok-tossed greens with glass noodles.",
                          image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
                          ingredients: ["100g Glass noodles", "3 Bok choy heads", "Minced garlic", "Tamari"],
                          steps: ["Soak glass noodles.", "Wok fry garlic & bok choy.", "Toss noodles together."],
                        })
                      }
                      className="px-3 py-1 font-semibold text-[#07241A] hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Đã đổi món thứ 4!")}
                      className="px-3 py-1 font-semibold text-[#727974] hover:text-[#07241A]"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#FBF9F6] p-4 text-xs">
                  <div>
                    <span className="font-bold uppercase text-[10px] text-[#727974]">
                      DINNER · 30 MINS
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#07241A] mt-0.5">
                      Kabocha Pumpkin &amp; Coconut Gentle Curry
                    </h4>
                    <p className="text-[11px] text-[#727974]">
                      Sweet squash simmered with light coconut nectar, turmeric, and crisp long beans.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMealForView({
                          id: "m-wed-3",
                          slot: "DINNER",
                          timeLabel: "Evening",
                          durationCalories: "30 mins",
                          title: "Kabocha Pumpkin & Coconut Gentle Curry",
                          description: "Sweet squash curry with coconut milk.",
                          image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80",
                          ingredients: ["300g Kabocha pumpkin", "200ml Coconut milk", "Turmeric, long beans"],
                          steps: ["Cube and steam pumpkin.", "Simmer with curry paste and coconut milk.", "Add long beans."],
                        })
                      }
                      className="px-3 py-1 font-semibold text-[#07241A] hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Đã đổi món thứ 4!")}
                      className="px-3 py-1 font-semibold text-[#727974] hover:text-[#07241A]"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Thursday – Sunday Overview ──────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-2.5">
              <h2 className="font-serif text-xl font-bold text-[#07241A]">
                Thursday – Sunday Overview
              </h2>
              <span className="text-xs text-[#727974]">
                4 Days Remaining
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#EFEEEB] shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#727974] uppercase">
                    Thursday · Day 4
                  </span>
                  <p className="font-serif text-xs font-bold text-[#07241A] mt-0.5">
                    Braised Tofu with Lemongrass &amp; Chili
                  </p>
                </div>
                <span className="text-sm text-[#16a34a]">✓</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#EFEEEB] shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#727974] uppercase">
                    Friday · Day 5
                  </span>
                  <p className="font-serif text-xs font-bold text-[#07241A] mt-0.5">
                    Vietnamese Sweet &amp; Sour Tamarind Soup
                  </p>
                </div>
                <span className="text-sm text-[#16a34a]">✓</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#EFEEEB] shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#727974] uppercase">
                    Saturday · Day 6
                  </span>
                  <p className="font-serif text-xs font-bold text-[#07241A] mt-0.5">
                    Mushroom &amp; Green Herb Rice Pot
                  </p>
                </div>
                <span className="text-sm text-[#16a34a]">✓</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#EFEEEB] shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#727974] uppercase">
                    Sunday · Day 7
                  </span>
                  <p className="font-serif text-xs font-bold text-[#07241A] mt-0.5">
                    Family Feast: Mushroom Hotpot Table
                  </p>
                </div>
                <span className="text-base">🍲</span>
              </div>
            </div>
          </section>
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
                src={selectedMealForView.image}
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
                  {selectedMealForView.slot} · {selectedMealForView.durationCalories}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#07241A]">
                  {selectedMealForView.title}
                </h3>
                <p className="mt-1 text-xs text-[#727974] leading-relaxed">
                  {selectedMealForView.description}
                </p>
              </div>

              {/* Ingredients */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]">
                  🥗 Nguyên liệu cần chuẩn bị:
                </h4>
                <ul className="list-disc pl-5 text-xs text-[#424844] space-y-1">
                  {selectedMealForView.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]">
                  🍳 Hướng dẫn chế biến:
                </h4>
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
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
