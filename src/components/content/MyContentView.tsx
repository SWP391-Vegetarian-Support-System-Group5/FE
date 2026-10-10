"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { MY_CONTENT_EVENT, getMyContentSnapshot, parseMyContent, removeManualContent, sampleContent, type MyContentItem } from "@/lib/my-content";
import ContentDialog from "./ContentDialog";
import ContentIcon, { type ContentIconName } from "./ContentIcon";

type KindFilter = "all" | "recipe" | "video";
type StatusFilter = "all" | "published" | "draft";
type ContentAction = { type: "preview" | "edit" | "delete"; item: MyContentItem };
const pageSize = 6;
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#07241A]";

function subscribeContent(callback: () => void) {
  window.addEventListener(MY_CONTENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(MY_CONTENT_EVENT, callback); window.removeEventListener("storage", callback); };
}

function displayText(item: MyContentItem, language: string) {
  return language === "vi" && item.translations ? item.translations : { title: item.title, description: item.description };
}

export default function MyContentView() {
  const { user, loading } = useAuth();
  const { language, locale, t } = useLanguage();
  const owner = user?.uid || "guest";
  const getSnapshot = useCallback(() => getMyContentSnapshot(owner), [owner]);
  const snapshot = useSyncExternalStore(subscribeContent, getSnapshot, () => "[]");
  const savedItems = useMemo(() => parseMyContent(snapshot), [snapshot]);
  const [samples, setSamples] = useState(sampleContent);
  const [source, setSource] = useState<"mine" | "sample" | null>(null);
  const sampleMode = source === "sample" || (source === null && savedItems.length === 0);
  const items = sampleMode ? samples : savedItems;
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<ContentAction | null>(null);
  const [notice, setNotice] = useState<{ en: string; vi: string } | null>(null);
  const [storageError, setStorageError] = useState(false);

  const counts = {
    all: items.length,
    published: items.filter((item) => item.status === "published").length,
    draft: items.filter((item) => item.status === "draft").length,
    video: items.filter((item) => item.kind === "video").length,
    recipe: items.filter((item) => item.kind === "recipe").length,
  };
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return items.filter((item) => {
      const text = displayText(item, language);
      const searchable = `${text.title} ${text.description} ${item.title} ${item.description}`.toLocaleLowerCase(locale);
      return (kind === "all" || item.kind === kind) && (status === "all" || item.status === status) && searchable.includes(needle);
    }).sort((a, b) => sort === "title"
      ? displayText(a, language).title.localeCompare(displayText(b, language).title, locale)
      : sort === "oldest" ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
      : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [items, query, kind, status, sort, language, locale]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const dateText = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const resetFilters = () => { setQuery(""); setKind("all"); setStatus("all"); setPage(1); };
  const switchSource = (next: "mine" | "sample") => { setSource(next); resetFilters(); setNotice(null); };

  function deleteItem(item: MyContentItem) {
    try {
      if (sampleMode) setSamples((current) => current.filter((entry) => entry.id !== item.id));
      else if (item.status === "draft") removeManualContent(owner);
      else return;
      setAction(null);
      setStorageError(false);
      setNotice(sampleMode ? { en: "Sample post removed. Your published content is unchanged.", vi: "Đã xóa bài mẫu. Nội dung đã đăng của bạn không thay đổi." } : { en: "Draft deleted.", vi: "Đã xóa bản nháp." });
    } catch { setStorageError(true); }
  }

  const stats: { label: string; value: number; detail: string; icon: ContentIconName; onClick: () => void }[] = [
    { label: t("TOTAL POSTS", "TỔNG BÀI VIẾT"), value: counts.all, detail: t("Your culinary collection", "Bộ sưu tập từ căn bếp của bạn"), icon: "recipe", onClick: resetFilters },
    { label: t("PUBLISHED", "ĐÃ ĐĂNG"), value: counts.published, detail: t("Stories shared with the community", "Câu chuyện chia sẻ cùng cộng đồng"), icon: "check", onClick: () => { setStatus("published"); setKind("all"); setPage(1); } },
    { label: t("DRAFTS", "BẢN NHÁP"), value: counts.draft, detail: t("A little inspiration in progress", "Ý tưởng đang chờ bạn hoàn thiện"), icon: "draft", onClick: () => { setStatus("draft"); setKind("all"); setPage(1); } },
    { label: t("COOKING VIDEOS", "VIDEO NẤU ĂN"), value: counts.video, detail: t("From your kitchen, frame by frame", "Từng khoảnh khắc trong căn bếp"), icon: "video", onClick: () => { setKind("video"); setStatus("all"); setPage(1); } },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#727974]">
        <Link href="/profile" className="transition hover:text-[#1E3A2F]">{t("Account & Activity", "Tài khoản & Hoạt động")}</Link>
        <span aria-hidden="true">/</span><span className="text-[#1E3A2F]">{t("Personal Content", "Nội dung cá nhân")}</span>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight sm:text-[56px]">{t("My Content", "Bài viết của tôi")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647068]">{t("A home for your culinary stories. Manage the recipes and cooking videos you’ve made, all in one place.", "Góc nhỏ dành cho câu chuyện ẩm thực của bạn. Quản lý công thức và video nấu ăn đã tạo, tất cả tại một nơi.")}</p>
        </div>
        <Link href="/create-content" className={`${buttonClass} shrink-0 self-start shadow-[0_4px_12px_#1E3A2F12] sm:self-auto`}><ContentIcon name="plus" />{t("Create Content", "Tạo bài viết")}</Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map((stat, index) => <button key={stat.icon} type="button" onClick={stat.onClick} className={`group rounded-2xl border p-4 text-left transition sm:p-5 ${index === 0 ? "border-[#1E3A2F] bg-[#1E3A2F] text-white hover:bg-[#254838]" : "border-[#E5E7DF] bg-white/75 hover:border-[#AEC0AE] hover:bg-white"}`}>
          <div className={`flex items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.12em] sm:text-[11px] ${index === 0 ? "text-[#D9E6DC]" : "text-[#68766A]"}`}><span>{stat.label}</span><ContentIcon name={stat.icon} /></div>
          <p className="mt-3 font-serif text-4xl sm:text-[42px]">{stat.value.toLocaleString(locale)}</p>
          <p className={`mt-1 text-[11px] leading-5 sm:text-xs ${index === 0 ? "text-[#C3D5C8]" : "text-[#727974]"}`}>{stat.detail}</p>
        </button>)}
      </div>

      <section aria-labelledby="collection-title" className="mt-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><h2 id="collection-title" className="font-serif text-2xl">{t("Your collection", "Bộ sưu tập của bạn")}</h2><span className="rounded-full bg-[#E8EDE4] px-2.5 py-1 text-[11px] font-semibold text-[#58705B]">{counts.all}</span></div>
          <div className="inline-flex self-start rounded-full border border-[#E5E7DF] bg-[#F0F0E9] p-1 text-xs font-semibold" aria-label={t("Content source", "Nguồn nội dung")}>
            <button type="button" aria-pressed={!sampleMode} onClick={() => switchSource("mine")} className={`rounded-full px-4 py-2 transition ${!sampleMode ? "bg-white text-[#1E3A2F] shadow-sm" : "text-[#727974] hover:text-[#1E3A2F]"}`}>{t("My posts", "Bài của tôi")}</button>
            <button type="button" aria-pressed={sampleMode} onClick={() => switchSource("sample")} className={`rounded-full px-4 py-2 transition ${sampleMode ? "bg-white text-[#1E3A2F] shadow-sm" : "text-[#727974] hover:text-[#1E3A2F]"}`}>{t("Sample preview", "Xem mẫu")}</button>
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-[#E5E7DF] bg-[#F0F2E9]/70 px-4 py-3 text-xs leading-6 text-[#647068] sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5"><ContentIcon name="leaf" className="mt-1 shrink-0 text-[#658266]" /><p>{sampleMode ? t("You’re exploring sample content. Try the filters, preview, edit or delete a sample post.", "Bạn đang xem nội dung mẫu. Thử bộ lọc, xem trước, chỉnh sửa hoặc xóa bài mẫu.") : t("Posts published and drafts saved on this browser appear here. Earlier posts and changes on other devices aren’t synced yet.", "Bài đăng thành công và bản nháp lưu trên trình duyệt này sẽ hiện ở đây. Bài cũ và thay đổi trên thiết bị khác chưa được đồng bộ.")}</p></div>
          {sampleMode && <button type="button" onClick={() => switchSource("mine")} className="inline-flex shrink-0 items-center gap-2 self-start font-semibold text-[#1E3A2F] hover:underline">{t("Go to my posts", "Đến bài của tôi")}<ContentIcon name="arrow" width="15" height="15" /></button>}
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#E5E7DF] pb-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5" aria-label={t("Content type", "Loại nội dung")}>
            {([{ value: "all", label: t("All posts", "Tất cả"), count: counts.all }, { value: "recipe", label: t("Recipes", "Công thức"), count: counts.recipe }, { value: "video", label: t("Videos & Recipes", "Video & Công thức"), count: counts.video }] as const).map((tab) => <button key={tab.value} type="button" aria-pressed={kind === tab.value} onClick={() => { setKind(tab.value); setPage(1); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition ${kind === tab.value ? "bg-[#1E3A2F] text-white" : "bg-[#F0F0E9] text-[#68766A] hover:bg-[#E8EDE4]"}`}>{tab.label}<span className={kind === tab.value ? "text-[#C3D5C8]" : "text-[#899388]"}>{tab.count}</span></button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[160px] flex-1 sm:w-60 sm:flex-none"><span className="sr-only">{t("Search your posts", "Tìm bài viết của bạn")}</span><ContentIcon name="search" className="pointer-events-none absolute left-3 top-3 text-[#899388]" width="16" height="16" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t("Search your stories…", "Tìm câu chuyện của bạn…")} className="h-10 w-full rounded-xl border border-[#E5E7DF] bg-white/80 pl-9 pr-3 text-xs outline-none transition placeholder:text-[#899388] focus:border-[#658266] focus:ring-2 focus:ring-[#658266]/10" /></label>
            <label><span className="sr-only">{t("Post status", "Trạng thái bài viết")}</span><select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} className="h-10 max-w-[160px] rounded-xl border border-[#E5E7DF] bg-white/80 px-3 text-xs outline-none focus:border-[#658266]"><option value="all">{t("All statuses", "Mọi trạng thái")}</option><option value="published">{t("Published", "Đã đăng")}</option><option value="draft">{t("Drafts", "Bản nháp")}</option></select></label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="text-xs text-[#727974]" role="status">{filtered.length} {t(filtered.length === 1 ? "story" : "stories", "bài viết")}{query && <> · <span className="font-medium text-[#1E3A2F]">“{query}”</span></>}</p>
          <div className="flex items-center gap-3"><label><span className="sr-only">{t("Sort posts", "Sắp xếp bài viết")}</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="max-w-[190px] bg-transparent py-2 text-xs text-[#647068] outline-none focus:underline"><option value="newest">{t("Recently updated", "Mới cập nhật")}</option><option value="oldest">{t("Oldest first", "Cũ nhất trước")}</option><option value="title">{t("Title A–Z", "Tên bài A–Z")}</option></select></label><span className="h-5 w-px bg-[#E5E7DF]" /><div className="inline-flex gap-1 rounded-lg bg-[#EEEEE7] p-1">{(["grid", "list"] as const).map((mode) => <button key={mode} type="button" aria-label={mode === "grid" ? t("Grid view", "Xem dạng lưới") : t("List view", "Xem danh sách")} aria-pressed={layout === mode} onClick={() => setLayout(mode)} className={`rounded-md p-1.5 transition ${layout === mode ? "bg-white text-[#1E3A2F] shadow-sm" : "text-[#899388] hover:text-[#1E3A2F]"}`}><ContentIcon name={mode} width="16" height="16" /></button>)}</div></div>
        </div>

        {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#CCDCCB] bg-[#E8F0E5] px-4 py-3 text-xs text-[#1E3A2F]"><span>{t(notice.en, notice.vi)}</span><button type="button" onClick={() => setNotice(null)} aria-label={t("Dismiss notification", "Đóng thông báo")}><ContentIcon name="close" width="16" height="16" /></button></div>}

        {loading && !sampleMode ? <div className="py-20 text-center text-sm text-[#727974]" role="status">{t("Loading your collection…", "Đang tải bộ sưu tập…")}</div> : visibleItems.length > 0 ? (
          <div className={layout === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
            {visibleItems.map((item) => {
              const text = displayText(item, language);
              const canEdit = sampleMode || item.status === "draft";
              return <article key={item.id} className={`group overflow-hidden rounded-2xl border border-[#E5E7DF] bg-white transition duration-200 hover:border-[#BBCAB7] hover:shadow-[0_8px_28px_#1E3A2F08] ${layout === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"}`}>
                <button type="button" onClick={() => setAction({ type: "preview", item })} aria-label={`${t("Preview", "Xem trước")}: ${text.title}`} className={`relative shrink-0 overflow-hidden bg-[#E8EDE4] ${layout === "list" ? "h-48 w-full sm:h-auto sm:min-h-44 sm:w-56" : "aspect-[16/9] w-full"}`}>
                  {item.image ? <Image src={item.image} alt={text.title} fill sizes={layout === "list" ? "(max-width: 640px) 100vw, 224px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"} className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,#D9E6DC,transparent)]"><ContentIcon name={item.kind === "video" ? "video" : "recipe"} width="64" height="64" className="text-[#8AA18B]" /></div>}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#FBF9F6]/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#1E3A2F] shadow-sm"><ContentIcon name={item.kind === "video" ? "video" : "recipe"} width="12" height="12" />{item.kind === "video" ? t("Video & Recipe", "Video & Công thức") : t("Recipe", "Công thức")}</span>
                  {item.kind === "video" && <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#1E3A2F] shadow-sm backdrop-blur-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 12 7-12 7z" /></svg></span>}
                </button>
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.status === "published" ? "bg-[#EDF3E9] text-[#4F754E]" : "bg-[#FBF0DE] text-[#A27A36]"}`}><span className={`h-1.5 w-1.5 rounded-full ${item.status === "published" ? "bg-[#6E9561]" : "bg-[#CDA258]"}`} />{item.status === "published" ? t("Published", "Đã đăng") : t("Draft", "Bản nháp")}</span><span className="text-[10px] text-[#899388]">{dateText(item.updatedAt)}</span></div>
                  <button type="button" onClick={() => setAction({ type: "preview", item })} className="mt-3 text-left"><h3 className="line-clamp-2 font-serif text-[25px] font-medium leading-[1.15] tracking-tight transition hover:text-[#658266]">{text.title || t("Untitled recipe", "Công thức chưa có tên")}</h3></button>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-[#727974]">{text.description || t("Your next culinary story starts here.", "Câu chuyện ẩm thực tiếp theo bắt đầu từ đây.")}</p>
                  <div className="mt-auto pt-4"><div className="flex items-center justify-between gap-3 border-t border-[#EFEEEB] pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#899388]">{item.minutes ? <><ContentIcon name="clock" width="14" height="14" />{item.minutes} {t("min", "phút")}</> : <><ContentIcon name="leaf" width="14" height="14" />VeggieMate</>}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setAction({ type: "preview", item })} aria-label={`${t("Preview", "Xem trước")}: ${text.title}`} title={t("Preview", "Xem trước")} className="rounded-lg p-2 text-[#68766A] transition hover:bg-[#EDF3E9] hover:text-[#1E3A2F]"><ContentIcon name="eye" width="16" height="16" /></button>
                      {canEdit && (sampleMode ? <button type="button" onClick={() => setAction({ type: "edit", item })} aria-label={`${t("Edit sample", "Sửa bài mẫu")}: ${text.title}`} title={t("Edit sample", "Sửa bài mẫu")} className="rounded-lg p-2 text-[#68766A] transition hover:bg-[#EDF3E9] hover:text-[#1E3A2F]"><ContentIcon name="edit" width="16" height="16" /></button> : <Link href="/create-content?draft=manual" aria-label={`${t("Continue draft", "Viết tiếp bản nháp")}: ${text.title}`} title={t("Continue draft", "Viết tiếp bản nháp")} className="rounded-lg p-2 text-[#68766A] transition hover:bg-[#EDF3E9] hover:text-[#1E3A2F]"><ContentIcon name="edit" width="16" height="16" /></Link>)}
                      {canEdit && <button type="button" onClick={() => { setStorageError(false); setAction({ type: "delete", item }); }} aria-label={`${t("Delete", "Xóa")}: ${text.title}`} title={t("Delete", "Xóa")} className="rounded-lg p-2 text-[#899388] transition hover:bg-red-50 hover:text-red-600"><ContentIcon name="trash" width="16" height="16" /></button>}
                    </div>
                  </div></div>
                </div>
              </article>;
            })}
          </div>
        ) : <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#CCD5C6] bg-white/50 px-6 py-16 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EDE4] text-[#658266]"><ContentIcon name={query || kind !== "all" || status !== "all" ? "search" : "recipe"} width="28" height="28" /></span><h3 className="mt-5 font-serif text-3xl">{query || kind !== "all" || status !== "all" ? t("No stories found", "Chưa tìm thấy bài viết") : t("Your story is waiting to be written", "Câu chuyện của bạn đang chờ được viết")}</h3><p className="mt-3 max-w-md text-sm leading-7 text-[#727974]">{query || kind !== "all" || status !== "all" ? t("Try another keyword or clear the filters to find your posts.", "Thử từ khóa khác hoặc bỏ bộ lọc để tìm bài viết của bạn.") : t("Create a recipe, save a draft or publish a cooking video. It will have a place right here.", "Tạo công thức, lưu bản nháp hoặc đăng video nấu ăn. Nội dung của bạn sẽ xuất hiện tại đây.")}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{query || kind !== "all" || status !== "all" ? <button type="button" onClick={resetFilters} className={buttonClass}>{t("Clear filters", "Bỏ bộ lọc")}</button> : <><Link href="/create-content" className={buttonClass}><ContentIcon name="plus" />{t("Create your first story", "Tạo bài viết đầu tiên")}</Link>{!user && <Link href="/login" className="rounded-xl border border-[#CCD5C6] px-5 py-3 text-sm font-semibold text-[#1E3A2F] hover:bg-[#E8EDE4]">{t("Sign in", "Đăng nhập")}</Link>}</>}</div></div>}

        {filtered.length > 0 && <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7DF] pt-5 text-xs text-[#727974]"><p>{t("Showing", "Hiển thị")} {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} {t("of", "trên")} {filtered.length} {t("posts", "bài viết")}</p><nav aria-label={t("Content pagination", "Phân trang bài viết")} className="flex items-center gap-1.5"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-[#E5E7DF] px-3 py-2 transition hover:bg-[#E8EDE4] disabled:cursor-not-allowed disabled:opacity-40">{t("Previous", "Trước")}</button>{Array.from({ length: totalPages }, (_, index) => index + 1).filter((number) => number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1).map((number, index, numbers) => <span key={number} className="inline-flex items-center gap-1.5">{index > 0 && number - numbers[index - 1] > 1 && <span>…</span>}<button type="button" aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)} className={`min-w-8 rounded-lg px-3 py-2 ${currentPage === number ? "bg-[#1E3A2F] text-white" : "hover:bg-[#E8EDE4]"}`}>{number}</button></span>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-[#E5E7DF] px-3 py-2 transition hover:bg-[#E8EDE4] disabled:cursor-not-allowed disabled:opacity-40">{t("Next", "Tiếp")}</button></nav></div>}
      </section>

      <aside className="mt-10 flex flex-col justify-between gap-5 rounded-2xl border border-[#DFE5D7] bg-[#ECF0E5] p-6 sm:flex-row sm:items-center sm:p-7"><div className="flex items-start gap-4"><span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D0DAC5] text-[#658266] sm:flex"><ContentIcon name="leaf" width="24" height="24" /></span><div><p className="font-serif text-2xl">{t("Every recipe has a story. What’s yours?", "Mỗi công thức là một câu chuyện. Của bạn là gì?")}</p><p className="mt-2 text-xs leading-6 text-[#727974]">{t("Turn a favorite dish into a little inspiration for someone else’s table.", "Biến món ăn yêu thích thành cảm hứng cho một bữa cơm khác.")}</p></div></div><Link href="/create-content" className="inline-flex shrink-0 items-center gap-2 self-start text-xs font-semibold text-[#1E3A2F] hover:underline">{t("Share something delicious", "Chia sẻ một món ngon")}<ContentIcon name="arrow" width="16" height="16" /></Link></aside>

      {action?.type === "preview" && <ContentDialog title={t("Story preview", "Xem trước bài viết")} onClose={() => setAction(null)}><div className="p-6">{action.item.image && <div className="relative mb-5 aspect-video overflow-hidden rounded-2xl"><Image src={action.item.image} alt={displayText(action.item, language).title} fill sizes="560px" className="object-cover" /></div>}<span className="text-xs font-semibold text-[#658266]">{action.item.kind === "video" ? t("Video & Recipe", "Video & Công thức") : t("Recipe", "Công thức")} · {action.item.status === "published" ? t("Published", "Đã đăng") : t("Draft", "Bản nháp")}</span><h3 className="mt-3 font-serif text-3xl">{displayText(action.item, language).title || t("Untitled recipe", "Công thức chưa có tên")}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#647068]">{displayText(action.item, language).description}</p>{action.item.recipe?.videoUrl && /^https?:\/\//i.test(action.item.recipe.videoUrl) && <video controls preload="metadata" src={action.item.recipe.videoUrl} className="mt-5 w-full rounded-xl" />}{(action.item.recipe || action.item.draft) && <><h4 className="mt-6 font-serif text-xl">{t("Ingredients", "Nguyên liệu")}</h4><ul className="mt-3 space-y-2 text-sm text-[#647068]">{(action.item.recipe?.ingredients || action.item.draft?.ingredients || []).map((ingredient, index) => <li key={index}>• {ingredient.amount} {ingredient.ingredientName}</li>)}</ul><h4 className="mt-6 font-serif text-xl">{t("Cooking steps", "Các bước nấu")}</h4><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#647068]">{(action.item.recipe?.steps || action.item.draft?.steps || []).map((step, index) => <li key={index}>{step.instruction}</li>)}</ol></>}{sampleMode && <p className="mt-6 rounded-xl bg-[#ECF0E5] p-3 text-xs leading-6 text-[#647068]">{t("This is a sample story for the interface preview. Video playback and full recipe details are available for your own published content.", "Đây là bài mẫu để xem trước giao diện. Video và chi tiết công thức sẽ có trong nội dung thật của bạn.")}</p>}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setAction(null)} className={buttonClass}>{t("Done", "Đóng")}</button></div></div></ContentDialog>}

      {action?.type === "edit" && <SampleEditDialog key={action.item.id} item={action.item} onClose={() => setAction(null)} onSave={(next) => { setSamples((current) => current.map((item) => item.id === next.id ? next : item)); setAction(null); setNotice({ en: "Sample changes saved for this preview session.", vi: "Đã lưu thay đổi bài mẫu trong phiên xem trước này." }); }} />}

      {action?.type === "delete" && <ContentDialog title={sampleMode ? t("Delete sample post?", "Xóa bài mẫu?") : t("Delete this draft?", "Xóa bản nháp này?")} onClose={() => setAction(null)}><div className="p-6"><p className="text-sm leading-7 text-[#647068]">{sampleMode ? t("This removes the sample from your preview session. Reloading the page restores all sample posts.", "Bài mẫu sẽ được xóa trong phiên xem trước. Tải lại trang để khôi phục tất cả bài mẫu.") : t("Your saved draft will be removed from this browser. This cannot be undone.", "Bản nháp đã lưu sẽ bị xóa khỏi trình duyệt này. Bạn không thể hoàn tác thao tác này.")}</p><p className="mt-4 rounded-xl bg-[#F0F0E9] p-4 font-serif text-xl">{displayText(action.item, language).title || t("Untitled recipe", "Công thức chưa có tên")}</p>{storageError && <p role="alert" className="mt-4 text-sm text-red-600">{t("Could not delete the draft. Check your browser storage settings and try again.", "Không thể xóa bản nháp. Kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.")}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setAction(null)} className="rounded-xl border border-[#E5E7DF] px-5 py-3 text-sm font-semibold hover:bg-[#E8EDE4]">{t("Keep it", "Giữ lại")}</button><button type="button" onClick={() => deleteItem(action.item)} className="inline-flex items-center gap-2 rounded-xl bg-[#A24635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#883727]"><ContentIcon name="trash" width="16" height="16" />{t("Delete", "Xóa")}</button></div></div></ContentDialog>}
    </div>
  );
}

function SampleEditDialog({ item, onSave, onClose }: { item: MyContentItem; onSave: (item: MyContentItem) => void; onClose: () => void }) {
  const { language, t } = useLanguage();
  // Edit the selected language only; authored text is never automatically translated.
  const [editingLanguage] = useState(language);
  const initial = displayText(item, editingLanguage);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  return <ContentDialog title={t("Edit sample story", "Chỉnh sửa bài mẫu")} onClose={onClose}><form className="space-y-5 p-6" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; const text = { title: title.trim(), description: description.trim() }; onSave({ ...item, ...(editingLanguage === "vi" ? { translations: text } : text), updatedAt: new Date().toISOString() }); }}><p className="rounded-xl bg-[#ECF0E5] p-3 text-xs leading-6 text-[#647068]">{t("Try editing a sample. These changes only affect this preview session.", "Thử chỉnh sửa bài mẫu. Thay đổi chỉ áp dụng trong phiên xem trước này.")}</p><label className="block text-sm font-semibold">{t("Story title", "Tên bài viết")}<input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#CCD5C6] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#658266]" /></label><label className="block text-sm font-semibold">{t("Your story", "Câu chuyện của bạn")}<textarea rows={5} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[#CCD5C6] bg-white px-4 py-3 text-sm font-normal leading-7 outline-none focus:border-[#658266]" /></label><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-[#E5E7DF] px-5 py-3 text-sm font-semibold hover:bg-[#E8EDE4]">{t("Cancel", "Hủy")}</button><button type="submit" className={buttonClass}>{t("Save changes", "Lưu thay đổi")}</button></div></form></ContentDialog>;
}
