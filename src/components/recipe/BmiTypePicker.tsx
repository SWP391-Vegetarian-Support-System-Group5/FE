"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getBmiTypes, type BmiType } from "@/lib/bmi-api";

export function useBmiLabel() {
  const { language } = useLanguage();
  return (type: BmiType) => language === "vi" ? type.name : ({ UNDERWEIGHT: "Underweight", NORMAL: "Normal", OBESE: "Obese" })[type.code];
}

export default function BmiTypePicker({ selected, onChange, disabled = false, catalog }: {
  selected: number[]; onChange: (ids: number[]) => void; disabled?: boolean; catalog?: BmiType[];
}) {
  const { t } = useLanguage();
  const label = useBmiLabel();
  const [types, setTypes] = useState<BmiType[]>([]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (catalog) return;
    const controller = new AbortController();
    getBmiTypes(controller.signal).then(items => { if (!controller.signal.aborted) { setTypes(items); setFailed(false); setLoaded(true); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [catalog, revision]);
  const options = catalog ?? types;
  return <fieldset disabled={disabled} className="min-w-0 disabled:opacity-60">
    <legend className="mb-2 text-sm font-semibold">{t("Recipe BMI groups", "Nhóm BMI của công thức")}</legend>
    {failed ? <p role="alert" className="text-sm text-red-700">{t("Could not load BMI groups.", "Không tải được nhóm BMI.")} <button type="button" onClick={() => setRevision(value => value + 1)} className="underline">{t("Retry", "Thử lại")}</button></p>
      : options.length === 0 ? <p role="status" className="text-sm text-[#727974]">{loaded || catalog ? t("No BMI groups configured.", "Chưa có cấu hình nhóm BMI.") : t("Loading BMI groups...", "Đang tải nhóm BMI...")}</p>
        : <div className="flex flex-wrap gap-x-5 gap-y-3">{options.map(type => <label key={type.id} className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.includes(type.id)} onChange={event => onChange(event.target.checked ? [...selected, type.id] : selected.filter(id => id !== type.id))} className="h-4 w-4 accent-[#254B38]" />{label(type)}
        </label>)}</div>}
  </fieldset>;
}
