"use client";
import { formatDietTypeName } from "@/lib/diet-type-display";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import ContentIcon from "@/components/content/ContentIcon";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getIngredients, type IngredientItem } from "@/lib/recipe-api";
import {
  createRestaurant, deleteRestaurant, listDietTypes, listRestaurants, updateRestaurant,
  type AdminRestaurant, type DietTypeOption, type RestaurantPayload,
} from "@/lib/admin-catalog-api";

const PAGE_SIZE = 8;
type FormValues = { name: string; address: string; dietTypeIds: number[]; foods: string; ingredientIds: number[] };
const emptyForm: FormValues = { name: "", address: "", dietTypeIds: [], foods: "", ingredientIds: [] };

function fromRestaurant(item: AdminRestaurant): FormValues {
  return {
    name: item.name, address: item.address,
    dietTypeIds: item.dietTypeIds, foods: item.foods.join(", "), ingredientIds: item.ingredientIds,
  };
}

function toPayload(form: FormValues): RestaurantPayload {
  return {
    name: form.name.trim(), address: form.address.trim(),
    dietTypeIds: form.dietTypeIds,
    foods: [...new Set(form.foods.split(",").map(food => food.trim()).filter(Boolean))],
    ingredientIds: form.ingredientIds,
  };
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
  const [notice, setNotice] = useState<"saved" | "deleted" | "exported" | "">("");
  const [query, setQuery] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminRestaurant | null>(null);
  const [form, setForm] = useState<FormValues | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [restaurants, types, catalog] = await Promise.all([listRestaurants(), listDietTypes(), getIngredients()]);
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
        if (active) { setItems(restaurants); setDietTypes(types); setIngredients(catalog); setLoaded(true); }
      })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Load failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase(locale);
    return items.filter(item =>
      (!dietFilter || item.dietTypeIds.includes(Number(dietFilter))) &&
      (!term || `${item.restaurantId} ${item.name} ${item.address} ${item.foods.join(" ")} ${item.ingredientNames.join(" ")}`.toLocaleLowerCase(locale).includes(term))
    );
  }, [items, query, dietFilter, locale]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  function exportCsv() {
    const cell = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["ID", "Name", "Address", "Latitude", "Longitude", "Diet types", "Foods"],
      ...filtered.map(item => [item.restaurantId, item.name, item.address, item.latitude, item.longitude,
        item.dietTypeIds.map(id => dietTypes.find(type => type.id === id)?.name ?? `#${id}`).join(", "), item.foods.join(", ")]),
    ];
    const blob = new Blob(["\uFEFF", rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `restaurants-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("exported");
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-[#EFEEEB] bg-white px-3 py-2 text-sm text-[#07241A] outline-none focus:border-[#1E3A2F]";

  return <div className="space-y-6 text-[#07241A]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEEEB] pb-4">
      <span className="font-serif text-lg font-bold">VeggieMate <span className="font-sans text-xs font-normal text-[#727974]">/ {t("Admin Area", "Khu vực quản trị")}</span></span>
      <div className="flex items-center gap-3"><span className="text-xs font-semibold">{user?.fullName ?? t("Admin", "Quản trị viên")}</span></div>
    </div>

    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-serif text-3xl font-bold">{t("Restaurants Management", "Quản lý nhà hàng")}</h1>
        <p className="mt-2 text-sm text-[#727974]">{t("Manage restaurant locations and food offerings.", "Quản lý vị trí nhà hàng và các món ăn.")}</p></div>
      <div className="flex gap-2">
        <button type="button" disabled={loading || !items.length} onClick={exportCsv} className="rounded-lg border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold disabled:opacity-50">{t("Export CSV", "Xuất CSV")}</button>
        <button type="button" disabled={loading} onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2F24] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><ContentIcon name="plus" />{t("Add Restaurant", "Thêm nhà hàng")}</button>
      </div>
    </div>

    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button type="button" onClick={() => void load()} className="ml-2 underline">{t("Retry", "Thử lại")}</button></div>}
    {notice && <p role="status" className="rounded-lg border border-[#D5EBDC] bg-[#EAF5EE] px-4 py-3 text-sm text-[#1E7E51]">{{ saved: t("Restaurant saved.", "Đã lưu nhà hàng."), deleted: t("Restaurant deleted.", "Đã xóa nhà hàng."), exported: t("CSV exported.", "Đã xuất CSV.") }[notice]}</p>}

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-[#EFEEEB] bg-white p-5"><p className="text-xs font-bold uppercase text-[#727974]">{t("Total Restaurants", "Tổng số nhà hàng")}</p><p className="mt-3 text-3xl font-bold">{loading ? "…" : loaded ? items.length.toLocaleString(locale) : "—"}</p></div>
      <div className="rounded-lg border border-[#EFEEEB] bg-white p-5"><p className="text-xs font-bold uppercase text-[#727974]">{t("With Coordinates", "Có tọa độ")}</p><p className="mt-3 text-3xl font-bold">{loading ? "…" : loaded ? items.filter(item => item.latitude !== null && item.longitude !== null).length.toLocaleString(locale) : "—"}</p></div>
    </div>

    <div className="flex flex-wrap gap-3">
      <label className="min-w-52 flex-1 text-xs font-semibold">{t("Search", "Tìm kiếm")}<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder={t("Name, address, food or ID", "Tên, địa chỉ, món ăn hoặc mã")} className={inputClass} /></label>
      <label className="min-w-44 text-xs font-semibold">{t("Diet Type", "Loại hình ăn chay")}<select value={dietFilter} onChange={event => { setDietFilter(event.target.value); setPage(1); }} className={inputClass}><option value="">{t("All diet types", "Tất cả loại hình")}</option>{dietTypes.map(type => <option key={type.id} value={type.id}>{formatDietTypeName(type.name)}</option>)}</select></label>
    </div>

    <div className="overflow-hidden rounded-lg border border-[#EFEEEB] bg-white">
      <div className="flex justify-between border-b border-[#EFEEEB] px-5 py-4 text-sm font-semibold"><span>{t("Restaurant Directory", "Danh sách nhà hàng")}</span><span className="text-[#727974]">{filtered.length.toLocaleString(locale)}</span></div>
      {loading ? <p className="p-6 text-sm text-[#727974]" role="status">{t("Loading restaurants...", "Đang tải nhà hàng...")}</p> : !loaded ? <p className="p-6 text-sm text-[#727974]">{t("Restaurants could not be loaded.", "Không thể tải nhà hàng.")}</p> : shown.length === 0 ? <p className="p-6 text-sm text-[#727974]">{t("No restaurants found.", "Không tìm thấy nhà hàng.")}</p> : <div className="divide-y divide-[#EFEEEB]">
        {shown.map(item => <div key={item.restaurantId} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-[#FBF9F6]">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.name}</strong><span className="text-xs text-[#727974]">#{item.restaurantId}</span>{item.dietTypeIds.map(id => <span key={id} className="rounded-full bg-[#EAF5EE] px-2 py-1 text-xs font-semibold text-[#1E7E51]">{dietTypes.find(type => type.id === id)?.name ?? `#${id}`}</span>)}</div>
            <p className="mt-1 text-xs text-[#727974]">{item.address}</p>
            {item.foods.length > 0 && <p className="mt-1 text-xs text-[#424844]">{t("Foods", "Món ăn")}: {item.foods.join(", ")}</p>}
            {item.ingredientNames.length > 0 && <p className="mt-1 text-xs text-[#424844]">{t("Ingredients", "Nguyên liệu")}: {item.ingredientNames.join(", ")}</p>}
            {item.latitude !== null && item.longitude !== null && <p className="mt-1 text-xs text-[#727974]">{t("Coordinates", "Tọa độ")}: {item.latitude}, {item.longitude}</p>}
          </div>
          <div className="flex gap-1"><button type="button" disabled={busy} onClick={() => openForm(item)} title={t("Edit restaurant", "Sửa nhà hàng")} aria-label={t("Edit restaurant", "Sửa nhà hàng")} className="rounded-lg p-2 hover:bg-[#EAF5EE] disabled:opacity-50"><ContentIcon name="edit" /></button><button type="button" disabled={busy} onClick={() => void remove(item)} title={t("Delete restaurant", "Xóa nhà hàng")} aria-label={t("Delete restaurant", "Xóa nhà hàng")} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><ContentIcon name="trash" /></button></div>
        </div>)}
      </div>}
      {!loading && filtered.length > PAGE_SIZE && <div className="flex items-center justify-between border-t border-[#EFEEEB] px-5 py-3 text-xs text-[#727974]"><span>{t("Page", "Trang")} {safePage} / {pageCount}</span><div className="flex gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="rounded border px-3 py-1 disabled:opacity-40" aria-label={t("Previous page", "Trang trước")}>‹</button><button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} className="rounded border px-3 py-1 disabled:opacity-40" aria-label={t("Next page", "Trang sau")}>›</button></div></div>}
    </div>

    {form && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setForm(null); }}><div role="dialog" aria-modal="true" aria-labelledby="restaurant-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4"><h2 id="restaurant-dialog-title" className="font-serif text-xl font-bold">{editing ? t("Edit Restaurant", "Sửa nhà hàng") : t("Add Restaurant", "Thêm nhà hàng")}</h2><button type="button" disabled={busy} onClick={() => setForm(null)} title={t("Close", "Đóng")} aria-label={t("Close", "Đóng")}><ContentIcon name="close" /></button></div>
      <form onSubmit={event => void save(event)} className="mt-4 space-y-4"><fieldset disabled={busy} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <label className="block text-xs font-semibold">{t("Name", "Tên")} *<input required maxLength={200} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
        <label className="block text-xs font-semibold">{t("Address", "Địa chỉ")} *<input required maxLength={300} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} placeholder={t("Street number, street, ward, city", "Số nhà, tên đường, phường/xã, tỉnh/thành phố")} className={inputClass} /></label>
        <fieldset className="text-xs font-semibold"><legend>{t("Diet Types", "Các loại ăn chay")} *</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{dietTypes.map(type => <label key={type.id} className="flex items-center gap-2 rounded border border-[#EFEEEB] px-3 py-2 font-normal"><input type="checkbox" checked={form.dietTypeIds.includes(type.id)} onChange={event => setForm({ ...form, dietTypeIds: event.target.checked ? [...form.dietTypeIds, type.id] : form.dietTypeIds.filter(id => id !== type.id) })} />{type.name}</label>)}</div></fieldset>
        <label className="block text-xs font-semibold">{t("Foods (comma separated)", "Món ăn (cách nhau bằng dấu phẩy)")}<textarea rows={3} value={form.foods} onChange={event => setForm({ ...form, foods: event.target.value })} className={inputClass} /></label>
        <div className="text-xs font-semibold">{t("Ingredients used", "Nguyên liệu sử dụng")} ({form.ingredientIds.length})
          <input type="search" value={ingredientQuery} onChange={event => setIngredientQuery(event.target.value)} placeholder={t("Find ingredient", "Tìm nguyên liệu")} className={inputClass} />
          <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[#EFEEEB] p-2">
            {ingredients.filter(item => item.name.toLocaleLowerCase(locale).includes(ingredientQuery.trim().toLocaleLowerCase(locale))).map(item =>
              <label key={item.id} className="flex items-center gap-2 px-2 py-1 font-normal"><input type="checkbox" checked={form.ingredientIds.includes(item.id)} onChange={event => setForm({ ...form, ingredientIds: event.target.checked ? [...form.ingredientIds, item.id] : form.ingredientIds.filter(id => id !== item.id) })} />{item.name}</label>)}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#EFEEEB] pt-4"><button type="button" onClick={() => setForm(null)} className="rounded-lg border border-[#EFEEEB] px-4 py-2 text-xs font-semibold">{t("Cancel", "Hủy")}</button><button type="submit" className="rounded-lg bg-[#0F2F24] px-5 py-2 text-xs font-semibold text-white">{busy ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button></div>
      </fieldset></form>
    </div></div>}
  </div>;
}
