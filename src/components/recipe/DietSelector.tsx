"use client";

import { useLanguage } from "@/context/LanguageContext";
import { isDietCompatible, type DietTypeItem, type RecipeIngredientPayload } from "@/lib/recipe-api";
import ContentIcon from "@/components/content/ContentIcon";

export function getDietLabel(name: string, language: "en" | "vi") {
  const labels: Record<string, [string, string]> = {
    VEGAN: ["Vegan", "Thuần chay"],
    LACTO_OVO_VEGETARIAN: ["Lacto-ovo vegetarian", "Chay có trứng & sữa"],
    LACTO_VEGETARIAN: ["Lacto vegetarian", "Chay có sữa"],
    OVO_VEGETARIAN: ["Ovo vegetarian", "Chay có trứng"],
    VEGETARIAN: ["Vegetarian", "Ăn chay"],
    FLEXITARIAN: ["Flexitarian", "Chay linh hoạt"],
  };
  const key = name.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return labels[key]?.[language === "vi" ? 1 : 0] || name.replaceAll("_", " ");
}

export default function DietSelector({ diets, ingredients, selectedIds, onChange }: {
  diets: DietTypeItem[];
  ingredients: RecipeIngredientPayload[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { language, t } = useLanguage();
  const filledIngredients = ingredients.filter(ingredient => ingredient.ingredientName.trim());
  const groups: Record<string, string> = { PLANT: t("plants", "thực vật"), DAIRY: t("dairy", "sữa"), EGG: t("eggs", "trứng"), HONEY: t("honey", "mật ong") };
  const conflicts = diets.filter(diet => selectedIds.includes(diet.id) && filledIngredients.length > 0 && !isDietCompatible(diet, filledIngredients));

  return <section className="my-8 rounded-3xl border border-[#E5E7DF] bg-white p-6 shadow-xs sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E7DF] pb-5">
      <div className="max-w-xl"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F0E4] text-[#254B38]"><ContentIcon name="leaf" width="22" height="22" /></span><h2 id="recipe-diet-title" className="font-serif text-2xl font-semibold text-[#07241A]">{t("Choose vegetarian diets", "Chọn chế độ ăn chay")}</h2></div><p id="recipe-diet-hint" className="mt-3 text-sm leading-6 text-[#727974]">{t("Select one or more diets you want this recipe to suit. We will check them against your ingredients.", "Chọn một hoặc nhiều chế độ ăn bạn muốn món này phù hợp. Các lựa chọn sẽ được đối chiếu với nguyên liệu.")}</p></div>
      <span className="rounded-full bg-[#F1F4EC] px-3 py-1.5 text-xs font-semibold text-[#416348]">{selectedIds.length} {t("selected", "đã chọn")}</span>
    </div>
    <fieldset aria-labelledby="recipe-diet-title" aria-describedby="recipe-diet-hint" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {diets.map(diet => {
        const selected = selectedIds.includes(diet.id);
        const compatible = filledIngredients.length > 0 ? isDietCompatible(diet, filledIngredients) : null;
        const description = diet.allowedIngredientGroups?.map(group => groups[group] || group).join(", ");
        return <label key={diet.id} className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-5 transition hover:shadow-sm ${selected ? "border-[#254B38] bg-[#F0F5EB]" : "border-[#E9ECE4] bg-[#FBF9F6] hover:border-[#B9CCB0]"}`}>
          <div className="flex items-start gap-3"><span className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-6 text-[#07241A]">{getDietLabel(diet.name, language)}</span><input type="checkbox" checked={selected} onChange={event => onChange(event.target.checked ? [...selectedIds, diet.id] : selectedIds.filter(id => id !== diet.id))} className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#254B38]" /></div>
          <p className="flex-1 text-xs leading-6 text-[#65705F]">{description ? `${t("Includes", "Cho phép")}: ${description}.` : t("Check this diet against your recipe ingredients.", "Kiểm tra chế độ ăn này với nguyên liệu của bạn.")}</p>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#DDE5D6] pt-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${compatible === null ? "bg-[#EEEFEA] text-[#727974]" : compatible ? "bg-[#DDEBDC] text-[#315F3A]" : "bg-[#FFF0D8] text-[#966326]"}`}>{compatible === null ? t("Add ingredients to check", "Thêm nguyên liệu để kiểm tra") : compatible ? t("✓ Ingredients match", "✓ Nguyên liệu phù hợp") : t("Check ingredients", "Cần kiểm tra nguyên liệu")}</span>{selected && <span className="text-[11px] font-semibold text-[#254B38]">{t("Selected", "Đã chọn")}</span>}</div>
        </label>;
      })}
    </fieldset>
    {diets.length === 0 && <p className="mt-5 rounded-xl bg-[#F5F3F0] p-4 text-sm text-[#727974]">{t("Diet options are not available yet. Try reloading when the server is available.", "Chưa tải được danh sách chế độ ăn. Thử tải lại khi máy chủ sẵn sàng.")}</p>}
    {conflicts.length > 0 && <p role="status" className="mt-4 rounded-xl bg-[#FFF5E4] p-4 text-xs leading-6 text-[#966326]">{t("Some ingredients do not match your selected diets. Adjust the ingredients or deselect those diets before publishing.", "Một số nguyên liệu chưa phù hợp với chế độ ăn đã chọn. Điều chỉnh nguyên liệu hoặc bỏ lựa chọn đó trước khi đăng.")}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-6 text-[#727974]">{t("Published diet compatibility is determined by the ingredients, rather than by the selections alone.", "Chế độ ăn phù hợp của bài đã đăng được xác định từ nguyên liệu, không chỉ từ các lựa chọn.")}</p>{selectedIds.length > 0 && <button type="button" onClick={() => onChange([])} className="rounded-full px-3 py-2 text-xs font-semibold text-[#416348] underline underline-offset-4 hover:bg-[#F1F4EC]">{t("Clear selection", "Bỏ chọn tất cả")}</button>}</div>
  </section>;
}
