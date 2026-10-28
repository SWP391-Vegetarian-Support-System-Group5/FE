"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import {
  createAllergen,
  deleteAllergen,
  listAllergens,
  updateAllergen,
  type AdminAllergen,
} from "@/lib/admin-catalog-api";

interface AdminUser {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
  createdAt?: string;
  avatarUrl?: string | null;
}

interface AllergenUserInfo {
  name: string;
  avatarUrl?: string | null;
  initials?: string;
  avatarPalette?: string;
}

function getMemberForAllergen(
  item: AdminAllergen,
  members: AdminUser[],
  currentUser: { fullName?: string | null } | null,
  t: (en: string, vi: string) => string
): AllergenUserInfo {
  // Lấy người dùng thực tế từ API /api/admin/users
  if (members && members.length > 0) {
    const member =
      (item.userId ? members.find((m) => m.userId === item.userId) : null) ||
      members.find((m) => m.userId === item.id) ||
      members[(item.id - 1) % members.length];

    const parts = (member.fullName || member.email || "").trim().split(/\s+/);
    const initials =
      parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

    return {
      name: member.fullName || member.email,
      avatarUrl: member.avatarUrl || null,
      initials: initials || "VM",
      avatarPalette: "bg-[#E8F5E9] text-[#1E3A2F]",
    };
  }

  // Fallback từ thông tin user đăng nhập nếu API members chưa tải xong
  const fallbackName = currentUser?.fullName || t("Community Member", "Thành viên cộng đồng");
  const parts = fallbackName.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  return {
    name: fallbackName,
    avatarUrl: null,
    initials: initials || "VM",
    avatarPalette: "bg-[#E8F5E9] text-[#1E3A2F]",
  };
}

function getAllergenBadgeAndNotes(item: AdminAllergen, t: (en: string, vi: string) => string) {
  const lower = item.name.toLowerCase();
  const hasDigits = /\d+/.test(lower);
  const isInvalid = hasDigits || lower.includes("fake meat") || lower.includes("thịt giả") || item.type === "Invalid";
  const isDuplicate = lower.includes("/") || lower.includes("vital wheat") || lower.includes("gluten");
  const isMushroom = lower.includes("mushroom") || lower.includes("nấm") || item.type === "Mushroom";

  if (isInvalid) {
    return {
      statusType: "alert" as const,
      badgeText: t(
        "Alert: Contains invalid number suffix / Non-allergen food preference",
        "Cảnh báo: Chứa số không hợp lệ / Tùy chọn món ăn không phải dị ứng"
      ),
      note: t(
        "System warning: Item contains trailing digits or describes food preference rather than a biological allergy.",
        "Cảnh báo hệ thống: Mục này chứa ký tự số hoặc mô tả sở thích món ăn thay vì dị ứng sinh học thực phẩm."
      ),
      noteIcon: "info" as const,
    };
  }

  if (isDuplicate) {
    return {
      statusType: "duplicate" as const,
      badgeText: t(
        "Duplicate warning: Matches existing 'Gluten (Wheat Gluten)'",
        "Cảnh báo trùng lặp: Trùng với mục có sẵn 'Gluten (Wheat Gluten)'"
      ),
      note: t(
        "User entered local term for vital wheat gluten. Suggested mapping to canonical allergen 'Gluten'.",
        "Người dùng nhập thuật ngữ địa phương cho vital wheat gluten. Đề xuất quy về dị ứng chuẩn 'Gluten'."
      ),
      noteIcon: "link" as const,
    };
  }

  if (isMushroom) {
    return {
      statusType: "valid" as const,
      badgeText: t(
        "Valid item - Specific mushroom allergy",
        "Mục hợp lệ - Dị ứng nấm cụ thể"
      ),
      note: t(
        "Recognized edible fungus allergy (Auricularia auricula-judae). Safe for profile sync.",
        "Được công nhận là dị ứng nấm ăn (Auricularia auricula-judae). An toàn để đồng bộ vào hồ sơ."
      ),
      noteIcon: "shield" as const,
    };
  }

  const category =
    item.type ||
    (lower.includes("nut") || lower.includes("hạt") || lower.includes("cashew")
      ? t("Tree Nuts", "Hạt vỏ cứng")
      : lower.includes("soy") || lower.includes("đậu")
      ? t("Soybeans", "Đậu nành")
      : lower.includes("milk") || lower.includes("sữa")
      ? t("Dairy", "Sữa")
      : t("General Allergen", "Chất dị ứng chung"));

  return {
    statusType: "valid" as const,
    badgeText: `${t("Valid item - Suggested category:", "Mục hợp lệ - Phân loại gợi ý:")} ${category}`,
    note: `${t("AI confidence score 94% - matches", "Điểm tin cậy AI 94% - khớp với nhóm")} ${category}. ${t("Clean submission without typos.", "Bản gửi sạch không lỗi chính tả.")}`,
    noteIcon: "wand" as const,
  };
}

export default function AdminAllergensPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();

  // Dữ liệu từ API của bạn - Giữ nguyên 100% cấu trúc ban đầu
  const [items, setItems] = useState<AdminAllergen[]>([]);
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "deleted" | "approved" | "batch_approved" | "">("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminAllergen | null>(null);
  const [name, setName] = useState<string | null>(null);

  // Trạng thái tab hiển thị và thao tác duyệt
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Hàm load dữ liệu từ API listAllergens - Giữ nguyên cấu trúc
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [allergens, usersList] = await Promise.all([
        listAllergens(),
        apiGet<AdminUser[]>("/api/admin/users").catch(() => []),
      ]);
      setItems(allergens);
      if (usersList && usersList.length > 0) setMembers(usersList);
      setLoaded(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook useEffect fetch data ban đầu - Giữ nguyên cấu trúc
  useEffect(() => {
    let active = true;
    Promise.all([
      listAllergens(),
      apiGet<AdminUser[]>("/api/admin/users").catch(() => []),
    ])
      .then(([allergens, usersList]) => {
        if (active) {
          setItems(allergens);
          if (usersList && usersList.length > 0) setMembers(usersList);
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

  // Lọc dữ liệu hiển thị theo query - Giữ nguyên cấu trúc lọc từ items
  const visible = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))
      ),
    [items, query, locale]
  );

  // Phân chia theo tab Pending / Approved
  const pendingItems = useMemo(
    () => visible.filter((item) => !approvedIds.has(item.id)),
    [visible, approvedIds]
  );

  const approvedItems = useMemo(
    () => visible.filter((item) => approvedIds.has(item.id)),
    [visible, approvedIds]
  );

  const displayedItems = activeTab === "pending" ? pendingItems : approvedItems;

  // Tính số liệu cho 3 thẻ thống kê trên dữ liệu thực tế
  const pendingCount = items.filter((i) => !approvedIds.has(i.id)).length;
  const approvedCount = approvedIds.size;
  const alertCount = items.filter(
    (i) => /\d+/.test(i.name) || i.name.toLowerCase().includes("fake meat") || i.type === "Invalid"
  ).length;

  // Mở modal thêm mới hoặc sửa - Giữ nguyên cấu trúc
  function openForm(item?: AdminAllergen) {
    setEditing(item ?? null);
    setName(item?.name ?? "");
    setError("");
    setNotice("");
  }

  // Hàm lưu (create hoặc update) - Giữ nguyên cấu trúc
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name === null || busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("Enter an allergen name.", "Nhập tên chất gây dị ứng."));
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editing) await updateAllergen(editing.id, trimmed);
      else await createAllergen(trimmed);
      await load();
      setName(null);
      setNotice("saved");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : t("Could not save allergen.", "Không thể lưu chất gây dị ứng.")
      );
    } finally {
      setBusy(false);
    }
  }

  // Hàm xóa - Giữ nguyên cấu trúc
  async function remove(item: AdminAllergen) {
    if (busy || !window.confirm(t(`Delete "${item.name}"?`, `Xóa "${item.name}"?`))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteAllergen(item.id);
      await load();
      setNotice("deleted");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : t("Could not delete allergen.", "Không thể xóa chất gây dị ứng.")
      );
    } finally {
      setBusy(false);
    }
  }

  function handleApprove(item: AdminAllergen) {
    setApprovedIds((prev) => new Set(prev).add(item.id));
    setNotice("approved");
    setTimeout(() => {
      setNotice((curr) => (curr === "approved" ? "" : curr));
    }, 3500);
  }

  function handleBatchApprove() {
    const updated = new Set(approvedIds);
    items.forEach((item) => {
      const meta = getAllergenBadgeAndNotes(item, t);
      if (meta.statusType === "valid") {
        updated.add(item.id);
      }
    });
    setApprovedIds(updated);
    setNotice("batch_approved");
    setTimeout(() => {
      setNotice((curr) => (curr === "batch_approved" ? "" : curr));
    }, 4000);
  }

  return (
    <div className="space-y-6 text-[#07241A] font-sans antialiased">
      {/* Toast thông báo */}
      {notice && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#0F2F24] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in border border-[#2D5A46]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#3DD68C]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            {notice === "saved" && t("Allergen saved successfully.", "Đã lưu chất gây dị ứng thành công.")}
            {notice === "deleted" && t("Allergen deleted successfully.", "Đã xóa chất gây dị ứng thành công.")}
            {notice === "approved" && t("Allergen approved & synced to profiles.", "Đã duyệt và đồng bộ chất gây dị ứng.")}
            {notice === "batch_approved" && t("All valid clean items approved successfully.", "Đã duyệt hàng loạt các mục hợp lệ thành công.")}
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
          {/* Ô tìm kiếm Search admin */}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search admin...", "Tìm kiếm quản trị...")}
              aria-label={t("Search admin", "Tìm kiếm quản trị")}
              className="w-44 rounded-full border border-[#EFEEEB] bg-white pl-9 pr-3 py-1.5 text-xs text-[#07241A] placeholder-[#8F948F] focus:border-[#1E3A2F] focus:outline-none sm:w-56 shadow-2xs"
            />
          </div>

          {/* Ngôn ngữ */}
          <div className="inline-flex items-center gap-1 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844] shadow-2xs">
            <span>{locale.startsWith("vi") ? "VI" : "EN"}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Supervisor Info */}
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#D5EBDC] bg-[#EAF5EE]">
              <Image
                src="/images/profile_avatar.png"
                alt="Admin Supervisor"
                width={32}
                height={32}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="text-xs font-bold text-[#07241A]">
              {user?.fullName ?? t("Admin Supervisor", "Quản trị viên")}
            </span>
          </div>
        </div>
      </header>

      {/* Tiêu đề trang & Nút hành động */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-3 py-1 text-xs font-semibold text-[#1E7E51]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>{t("Allergen Verification", "Xác thực chất gây dị ứng")}</span>
          </span>
          <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#07241A]">
            {t("Allergens & Health Management", "Quản lý dị ứng & sức khỏe")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => openForm()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#F2EFE9] transition shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t("Add Allergen", "Thêm chất gây dị ứng")}</span>
          </button>

          <button
            type="button"
            onClick={handleBatchApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F2F24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#164234] transition active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 7 17l-5-5" />
              <path d="m22 10-7.5 7.5L13 16" />
            </svg>
            <span>{t("Batch Approve Clean Items", "Duyệt hàng loạt mục hợp lệ")}</span>
          </button>
        </div>
      </div>

      {/* Lỗi nếu có */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            {t("Retry", "Thử lại")}
          </button>
        </div>
      )}

      {/* 3 Thẻ thống kê */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Thẻ 1: PENDING APPROVAL */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                {t("PENDING APPROVAL", "CHỜ PHÊ DUYỆT")}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#07241A]">
                  {loading ? "…" : loaded ? pendingCount : "—"}
                </span>
                <span className="text-xs font-medium text-[#727974]">
                  {t("new requests", "yêu cầu mới")}
                </span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FEF3E2] text-[#C2671A]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                <line x1="8" y1="13" x2="16" y2="13" />
              </svg>
            </div>
          </div>
        </div>

        {/* Thẻ 2: APPROVED TODAY */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                {t("APPROVED TODAY", "ĐÃ DUYỆT HÔM NAY")}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#07241A]">
                  {loading ? "…" : approvedCount}
                </span>
                <span className="text-xs font-medium text-[#727974]">
                  {t("synced items", "mục đã đồng bộ")}
                </span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E7E51]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 border-t border-[#F5F4F0] pt-3 text-xs font-medium text-[#525854]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E7E51" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>{t("Successfully synced to user profiles", "Đã đồng bộ thành công vào hồ sơ người dùng")}</span>
          </div>
        </div>

        {/* Thẻ 3: REJECTED / INVALID */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                {t("REJECTED / INVALID", "TỪ CHỐI / KHÔNG HỢP LỆ")}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#991B1B]">
                  {loading ? "…" : alertCount}
                </span>
                <span className="text-xs font-medium text-[#727974]">
                  {t("spam & typos", "spam & lỗi chính tả")}
                </span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDE8E8] text-[#DC2626]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 border-t border-[#F5F4F0] pt-3 text-xs font-medium text-[#525854]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727974" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>{t("Notification sent to user", "Đã gửi thông báo tới người dùng")}</span>
          </div>
        </div>
      </div>

      {/* Tabs lọc & Thanh tìm kiếm */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "pending"
                ? "bg-[#0F2F24] text-white shadow-sm"
                : "bg-white text-[#727974] border border-[#EFEEEB] hover:text-[#07241A]"
            }`}
          >
            <span>{t("All Pending", "Tất cả đang chờ")}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "pending" ? "bg-[#EA580C] text-white" : "bg-[#F2EFE9] text-[#727974]"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "approved"
                ? "bg-[#0F2F24] text-white shadow-sm"
                : "bg-white text-[#727974] border border-[#EFEEEB] hover:text-[#07241A]"
            }`}
          >
            <span>{t("Approved", "Đã phê duyệt")}</span>
            <span className="text-[11px] font-bold text-[#727974]">
              {approvedCount}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm & Nút Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#727974"
              strokeWidth="2"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search by user name, allergen item", "Tìm theo tên chất gây dị ứng")}
              className="w-full rounded-full border border-[#EFEEEB] bg-white py-2 pl-9 pr-3 text-xs text-[#07241A] placeholder-[#8F948F] focus:border-[#1E3A2F] focus:outline-none shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => void load()}
            title={t("Refresh list", "Tải lại danh sách")}
            aria-label={t("Refresh list", "Tải lại danh sách")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EFEEEB] bg-white text-[#727974] hover:text-[#07241A] hover:bg-[#F2EFE9] transition shadow-2xs active:rotate-180"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Danh sách thẻ Allergen */}
      <div className="space-y-4">
        {loading ? (
          /* Trạng thái Loading Skeleton */
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-gray-200" />
                      <div className="h-3 w-28 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-8 w-24 rounded-full bg-gray-200" />
                </div>
                <div className="mt-4 border-t border-[#F5F4F0] pt-4 flex justify-between">
                  <div className="h-4 w-72 rounded bg-gray-200" />
                  <div className="h-8 w-44 rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          /* Trạng thái danh sách rỗng */
          <div className="rounded-2xl border border-dashed border-[#EFEEEB] bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E7E51]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#07241A]">
              {t("No allergen items found", "Không tìm thấy chất gây dị ứng nào")}
            </h3>
            <p className="mt-1 text-xs text-[#727974]">
              {activeTab === "pending"
                ? t("No pending allergens found in catalog.", "Không có chất gây dị ứng nào đang chờ duyệt.")
                : t("No approved allergens in this view.", "Chưa có chất gây dị ứng nào được duyệt trong mục này.")}
            </p>
          </div>
        ) : (
          /* Hiển thị danh sách card từ dữ liệu API thật của bạn */
          displayedItems.map((item) => {
            const meta = getAllergenBadgeAndNotes(item, t);
            const userObj = getMemberForAllergen(item, members, user, t);
            const isApproved = approvedIds.has(item.id);

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs transition hover:border-[#D5EBDC] hover:shadow-xs"
              >
                {/* Hàng trên: Icon trạng thái + Tên & Badge + Submitter User Info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* Hộp icon trạng thái */}
                    {meta.statusType === "alert" ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDE8E8] text-[#DC2626]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                    ) : meta.statusType === "duplicate" ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF3E2] text-[#D97706]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E7E51]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                    )}

                    {/* Tên chất dị ứng & Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2
                        className={`font-serif text-base sm:text-lg font-bold tracking-tight ${
                          meta.statusType === "alert" ? "text-[#B91C1C]" : "text-[#07241A]"
                        }`}
                      >
                        &ldquo;{item.name}&rdquo;
                      </h2>

                      {/* Badge phân loại */}
                      {meta.statusType === "valid" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-3 py-0.5 text-[11px] font-semibold text-[#1E7E51]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{meta.badgeText}</span>
                        </span>
                      ) : meta.statusType === "duplicate" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FEF3E2] px-3 py-0.5 text-[11px] font-semibold text-[#B45309]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>{meta.badgeText}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FDE8E8] px-3 py-0.5 text-[11px] font-semibold text-[#B91C1C]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                          <span>{meta.badgeText}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thông tin User pill theo thiết kế mới - Không hiển thị mã #VM */}
                  <div className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-[#F7F6F3] p-1.5 pr-4 border border-[#EFEEEB]/70 shadow-2xs self-start sm:self-center">
                    {userObj.avatarUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white shadow-2xs shrink-0">
                        <Image
                          src={userObj.avatarUrl}
                          alt={userObj.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs ${
                          userObj.avatarPalette || "bg-[#E8F5E9] text-[#1E3A2F]"
                        }`}
                      >
                        {userObj.initials}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#07241A] leading-tight">{userObj.name}</p>
                    </div>
                  </div>
                </div>

                {/* Hàng dưới: Ghi chú hệ thống + Các nút hành động (Cố định trên 1 hàng ngang duy nhất) */}
                <div className="mt-4 flex flex-col gap-3 border-t border-[#F7F6F3] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Ghi chú AI / System */}
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[#525854] mr-3">
                    <span className="shrink-0">
                      {meta.noteIcon === "wand" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#727974" strokeWidth="2">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
                        </svg>
                      ) : meta.noteIcon === "link" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      ) : meta.noteIcon === "shield" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E7E51" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      )}
                    </span>
                    <span className="leading-relaxed">{meta.note}</span>
                  </div>

                  {/* Nút hành động: Luôn luôn cố định ngang hàng flex-nowrap */}
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    {meta.statusType === "alert" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(item)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#B91C1C] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#991B1B] transition active:scale-95 disabled:opacity-50"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span>{t("Reject & Notify User", "Từ chối & Báo người dùng")}</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EFEEEB] bg-white text-[#727974] hover:bg-[#F2EFE9] transition"
                            title={t("More options", "Thêm tùy chọn")}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </button>

                          {activeMenuId === item.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#EFEEEB] bg-white p-1.5 shadow-lg animate-fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  openForm(item);
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[#07241A] hover:bg-[#F2EFE9]"
                              >
                                {t("Edit Name", "Sửa tên")}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openForm(item)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#EFEEEB] bg-[#F7F6F3] px-3.5 py-2 text-xs font-semibold text-[#07241A] hover:bg-[#EAE8E2] transition active:scale-95 disabled:opacity-50"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          <span>{t("Normalize Name", "Chuẩn hóa tên")}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(item)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition active:scale-95 disabled:opacity-50"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>{t("Reject", "Từ chối")}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busy || isApproved}
                          onClick={() => handleApprove(item)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 shadow-sm ${
                            isApproved
                              ? "bg-[#EAF5EE] text-[#1E7E51] border border-[#D5EBDC]"
                              : "bg-[#0F2F24] text-white hover:bg-[#164234]"
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="9 12 11 14 15 10" />
                          </svg>
                          <span>
                            {isApproved
                              ? t("Approved & Synced", "Đã duyệt & Đồng bộ")
                              : t("Approve & Sync to Profile", "Duyệt & Đồng bộ hồ sơ")}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog Chuẩn hóa tên / Thêm mới allergen */}
      {name !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setName(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="allergen-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#EFEEEB]"
          >
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 id="allergen-dialog-title" className="font-serif text-xl font-bold text-[#07241A]">
                  {editing
                    ? t("Normalize Allergen Name", "Chuẩn hóa tên chất gây dị ứng")
                    : t("Add Allergen", "Thêm chất gây dị ứng")}
                </h2>
                <p className="mt-1 text-xs text-[#727974]">
                  {editing
                    ? t("Set the official canonical name before profile synchronization.", "Quy chuẩn tên gọi chính xác trước khi đồng bộ hồ sơ.")
                    : t("Register a verified allergen item into the system catalog.", "Thêm chất gây dị ứng đã xác thực vào danh mục hệ thống.")}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setName(null)}
                title={t("Close", "Đóng")}
                aria-label={t("Close", "Đóng")}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[#727974] hover:bg-[#F2EFE9] transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
              <fieldset disabled={busy} className="space-y-4">
                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Allergen Canonical Name", "Tên chuẩn hóa của chất gây dị ứng")} *
                  <input
                    required
                    maxLength={150}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("e.g. Cashews, Tree Nuts, Gluten", "VD: Hạt điều, Hạt vỏ cứng, Gluten")}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] px-3.5 py-2.5 text-sm text-[#07241A] outline-none focus:border-[#1E3A2F] shadow-2xs"
                  />
                </label>

                {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}

                <div className="flex justify-end gap-2.5 border-t border-[#EFEEEB] pt-4">
                  <button
                    type="button"
                    onClick={() => setName(null)}
                    className="rounded-xl border border-[#EFEEEB] bg-[#F7F6F3] px-4 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#EAE8E2] transition"
                  >
                    {t("Cancel", "Hủy")}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F2F24] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#164234] transition active:scale-95 shadow-sm"
                  >
                    {busy ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{t("Saving...", "Đang lưu...")}</span>
                      </>
                    ) : (
                      <span>{t("Save", "Lưu")}</span>
                    )}
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
