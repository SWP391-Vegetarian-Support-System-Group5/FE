"use client";
import UiText from "@/components/UiText";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetch, apiGet } from "@/lib/api";

interface AdminUser {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
}

const PAGE_SIZE = 10;

export default function AdminMembersPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") return;
    const controller = new AbortController();
    apiGet<AdminUser[]>("/api/admin/users", { signal: controller.signal })
      .then(data => { setMembers(data); setError(""); })
      .catch(() => { if (!controller.signal.aborted) setError("load"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.role]);

  const filtered = useMemo(() => members.filter(member => {
    const text = search.trim().toLowerCase();
    return (member.fullName.toLowerCase().includes(text) || member.email.toLowerCase().includes(text) || String(member.userId).includes(text))
      && (status === "all" || member.isActive === (status === "active"));
  }).sort((a, b) => sortNewest ? b.userId - a.userId : a.userId - b.userId), [members, search, status, sortNewest]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = members.find(member => member.userId === selectedId);
  const statusLabel = (active: boolean) => active ? t("Active", "Đang hoạt động") : t("Suspended", "Đã đình chỉ");

  async function updateStatus(member: AdminUser) {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await apiFetch(`/api/admin/users/${member.userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setMembers(current => current.map(item => item.userId === member.userId ? { ...item, isActive: !member.isActive } : item));
      setSuccess(true);
    } catch {
      setError("save");
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-6">
    <header className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
      <div className="flex items-center gap-2"><Link href="/" className="font-serif text-xl font-bold text-[#07241A]">VeggieMate</Link><span className="text-[#A0A5A1]">/</span><span className="rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs">{t("Admin Area", "Khu vực quản trị")}</span></div>
      <div className="flex items-center gap-4"><div className="text-right"><p className="text-xs font-bold text-[#07241A]">{user?.fullName || "Quản trị viên"}</p><p className="text-[10px] text-[#727974]">{t("Supervisor", "Quản trị viên")}</p></div><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-xs font-bold text-white">AD</div></div>
    </header>
    <div className="pt-2"><p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">{t("Directory • Community Roster", "Danh mục • Danh sách cộng đồng")}</p><h1 className="mt-1 font-serif text-3xl font-bold text-[#07241A] lg:text-4xl">{t("Members", "Thành viên")}</h1><p className="mt-1 text-xs text-[#727974]">{t("Manage registered VeggieMate community members.", "Quản lý thành viên cộng đồng VeggieMate.")}</p></div>
    <div className="flex flex-wrap items-center gap-3">
      <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={t("Search members by name or email...", "Tìm theo tên hoặc email...")} aria-label={t("Search members", "Tìm thành viên")} className="min-w-[280px] flex-1 rounded-2xl border border-[#EFEEEB] bg-[#F5F3F0] px-4 py-2.5 text-xs text-[#07241A]" />
      <select value={status} onChange={event => { setStatus(event.target.value as typeof status); setPage(1); }} aria-label={t("Filter members by status", "Lọc thành viên theo trạng thái")} className="rounded-2xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#07241A]"><option value="all">{t("All statuses", "Mọi trạng thái")}</option><option value="active">{t("Active", "Đang hoạt động")}</option><option value="suspended">{t("Suspended", "Đã đình chỉ")}</option></select>
      <button type="button" onClick={() => setSortNewest(value => !value)} className="rounded-2xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#07241A]">{sortNewest ? t("ID: Newest", "ID: Mới nhất") : t("ID: Oldest", "ID: Cũ nhất")}</button>
    </div>
    {error && <p role="alert" className="text-xs text-[#C2410C]">{error === "save" ? t("Could not update member status. Please try again.", "Không thể cập nhật trạng thái. Vui lòng thử lại.") : t("Could not load members.", "Không thể tải thành viên.")}</p>}
    {success && <p role="status" className="text-xs text-[#15803D]">{t("Member status updated.", "Đã cập nhật trạng thái thành viên.")}</p>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className={showProfile && selected ? "lg:col-span-8" : "lg:col-span-12"}><div className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]"><th className="pb-3">{t("Member", "Thành viên")}</th><th className="pb-3">{t("Email", "Email")}</th><th className="pb-3">{t("Role", "Vai trò")}</th><th className="pb-3">{t("Status", "Trạng thái")}</th></tr></thead><tbody className="divide-y divide-[#EFEEEB]/60">
        {visible.map(member => <tr key={member.userId} onClick={() => { setSelectedId(member.userId); setShowProfile(true); setSuccess(false); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(member.userId); setShowProfile(true); } }} tabIndex={0} aria-label={t(`View ${member.fullName}`, `Xem ${member.fullName}`)} className={`cursor-pointer hover:bg-[#FBF9F6] focus:outline-[#1E3A2F] ${selectedId === member.userId && showProfile ? "bg-[#F0F5F2]" : ""}`}><td className="py-4 pr-4"><span className="font-bold text-[#07241A]">{member.fullName}</span><span className="block text-[11px] text-[#727974]">#{member.userId}</span></td><td className="py-4 pr-4 text-[#424844]">{member.email}</td><td className="py-4 pr-4 text-[#727974]"><UiText text={member.role} /></td><td className="py-4"><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${member.isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#C2410C]"}`}>{statusLabel(member.isActive)}</span></td></tr>)}
      </tbody></table>{loading && <p className="py-4 text-xs text-[#727974]">{t("Loading members...", "Đang tải thành viên...")}</p>}{!loading && !error && visible.length === 0 && <p className="py-4 text-xs text-[#727974]">{t("No members found.", "Không tìm thấy thành viên.")}</p>}</div>
      <div className="mt-4 flex items-center justify-between border-t border-[#EFEEEB] pt-4 text-xs text-[#727974]"><p>{t("Showing", "Hiển thị")} {visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("of", "trong")} {filtered.length.toLocaleString(locale)} {t("members", "thành viên")}</p><div className="flex items-center gap-1"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label={t("Previous page", "Trang trước")} className="h-7 w-7 rounded-lg border border-[#EFEEEB] disabled:opacity-40">‹</button><span className="min-w-7 text-center font-bold text-[#07241A]">{currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label={t("Next page", "Trang sau")} className="h-7 w-7 rounded-lg border border-[#EFEEEB] disabled:opacity-40">›</button></div></div></div></section>
      {showProfile && selected && <aside className="lg:col-span-4"><div className="space-y-5 rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm"><div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3"><h2 className="font-serif text-base font-bold text-[#07241A]">{t("Member Profile", "Hồ sơ thành viên")}</h2><button type="button" onClick={() => setShowProfile(false)} aria-label={t("Close profile", "Đóng hồ sơ")} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[#727974]">×</button></div><div className="rounded-2xl bg-[#F7F5F1] p-5 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1E3A2F] text-2xl font-bold text-white">{selected.fullName.trim().split(/\s+/).slice(-2).map(part => part[0]).join("").toUpperCase()}</div><h3 className="mt-3 font-serif text-lg font-bold text-[#07241A]">{selected.fullName}</h3><p className="break-all text-xs text-[#727974]">{selected.email}</p><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${selected.isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#C2410C]"}`}>{statusLabel(selected.isActive)}</span></div><dl className="space-y-2 text-xs"><div className="flex justify-between"><dt className="text-[#727974]">{t("Member ID", "Mã thành viên")}</dt><dd>#{selected.userId}</dd></div><div className="flex justify-between"><dt className="text-[#727974]">{t("Role", "Vai trò")}</dt><dd><UiText text={selected.role} /></dd></div></dl><div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-[11px] text-[#727974]">{t("Private health and location data are excluded from this view.", "Dữ liệu sức khỏe và vị trí riêng tư không hiển thị tại đây.")}</div><button type="button" disabled={saving || selected.userId === user?.userId} onClick={() => void updateStatus(selected)} className={`w-full rounded-xl py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selected.isActive ? "bg-[#FFF1EE] text-[#C2410C] hover:bg-[#FEE2E2]" : "bg-[#1E3A2F] text-white hover:bg-[#07241A]"}`}>{saving ? t("Updating...", "Đang cập nhật...") : selected.isActive ? t("Suspend Member", "Đình chỉ thành viên") : t("Reactivate Member", "Kích hoạt lại thành viên")}</button></div></aside>}
    </div>
  </div>;
}
