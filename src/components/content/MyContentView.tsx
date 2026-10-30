"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { createRecipe, deleteVideoRecipeDraft, getMyVideoRecipeDrafts, getRecipeById, publishVideoRecipeDraft, updateRecipe, type VideoRecipeDraftResponse } from "@/lib/recipe-api";
import { deletePost, updatePost } from "@/lib/post-api";
import { createCommunityEventSource, getMyPosts, postToRecipe, type PostResponse } from "@/lib/community-api";
import { MY_CONTENT_EVENT, getMyContentSnapshot, getVideoThumbnailUrl, parseMyContent, removeManualContent, sampleContent, saveContentItem, type MyContentItem } from "@/lib/my-content";
import { localizeRecipeTitle, localizeText, localizeIngredient, localizeAmount } from "@/lib/localized-content";
import ContentDialog from "./ContentDialog";
import FeedImage from "@/components/ui/FeedImage";
import CardSkeleton from "@/components/ui/CardSkeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
  const text = language === "vi" && item.translations ? item.translations : { title: item.title, description: item.description };
  if (language !== "vi") return text;
  return {
    title: localizeRecipeTitle(text.title, "vi"),
    description: localizeText(text.description, "vi"),
  };
}

function itemThumbnail(item: MyContentItem) {
  return item.image || item.recipe?.thumbnailUrl || getVideoThumbnailUrl(item.recipe?.videoUrl);
}

function recipeIdFromItem(item: MyContentItem) {
  if (typeof item.recipe?.postId === "number") return item.recipe.postId;
  const match = /^recipe-(\d+)$/.exec(item.id);
  return match ? Number(match[1]) : null;
}

function postToContentItem(post: PostResponse): MyContentItem {
  const recipe = postToRecipe(post);
  return {
    id: `recipe-${post.postId}`,
    title: post.title,
    description: post.content,
    postType: post.postType,
    moderationReason: post.moderationReason,
    kind: post.videoUrl ? "video" : "recipe",
    status: post.status === "PUBLISHED" ? "published" : "draft",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    image: post.thumbnailUrl || getVideoThumbnailUrl(post.videoUrl),
    recipe,
  };
}

function videoDraftToContentItem(draft: VideoRecipeDraftResponse): MyContentItem {
  return {
    id: `video-draft-${draft.videoRecipeDraftId}`,
    title: draft.title || draft.recipeName || `Video #${draft.videoRecipeDraftId}`,
    description: draft.description || draft.errorMessage || "",
    kind: "video", status: "draft", createdAt: draft.createdAt, updatedAt: draft.updatedAt,
    image: getVideoThumbnailUrl(draft.videoUrl), minutes: draft.estimatedPrepMinutes || undefined,
    videoDraft: draft,
  };
}

export default function MyContentView() {
  const { user, loading } = useAuth();
  const { language, locale, t } = useLanguage();
  const owner = user?.uid || "guest";
  const getSnapshot = useCallback(() => getMyContentSnapshot(owner), [owner]);
  const snapshot = useSyncExternalStore(subscribeContent, getSnapshot, () => "[]");
  const localSavedItems = useMemo(() => parseMyContent(snapshot), [snapshot]);
  const [serverItems, setServerItems] = useState<MyContentItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const savedItems = useMemo(() => [
    ...serverItems,
    ...localSavedItems.filter((item) => item.status === "draft"),
  ], [localSavedItems, serverItems]);
  const [samples, setSamples] = useState(sampleContent);
  const [source, setSource] = useState<"mine" | "sample" | null>(null);
  const sampleMode = source === "sample" || (source === null && !user && savedItems.length === 0);
  const items = sampleMode ? samples : savedItems;
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<ContentAction | null>(null);
  const [notice, setNotice] = useState<{ en: string; vi: string; tone?: "error"; undo?: { item: MyContentItem; sample: boolean; owner: string } } | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [pendingPublish, setPendingPublish] = useState<{ kind: "video"; draft: VideoRecipeDraftResponse } | { kind: "manual"; item: MyContentItem } | null>(null);
  const hydratedRecipeIds = useRef(new Set<number>());
  const latestServerRequest = useRef(0);

  const loadServerItems = useCallback(async () => {
    const request = ++latestServerRequest.current;
    if (!user) {
      setServerItems([]);
      setDraftLoadError(false);
      setRemoteLoading(false);
      return;
    }
    setRemoteLoading(true);
    try {
      const [postsResult, draftsResult] = await Promise.allSettled([getMyPosts(), getMyVideoRecipeDrafts()]);
      if (request !== latestServerRequest.current) return;
      setDraftLoadError(draftsResult.status === "rejected");
      const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
      const drafts = draftsResult.status === "fulfilled" ? draftsResult.value : [];
      const items = await Promise.all(posts.map(async (post) => {
        const item = postToContentItem(post);
        if (post.postType !== "RECIPE") return item;
        try {
          const recipe = await getRecipeById(post.postId);
          return {
            ...item,
            title: recipe.title || item.title,
            description: recipe.content || item.description,
            recipe,
            image: recipe.thumbnailUrl || item.image || getVideoThumbnailUrl(recipe.videoUrl),
            minutes: (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) || item.minutes,
          };
        } catch {
          return item;
        }
      }));
      if (request === latestServerRequest.current) setServerItems([
        ...items.map(item => ({ ...item, videoDraft: drafts.find(draft => draft.recipePostId === recipeIdFromItem(item) && draft.status !== "PUBLISHED") })),
        ...drafts.filter(draft => !draft.recipePostId).map(videoDraftToContentItem),
      ]);
    } catch {
      if (request === latestServerRequest.current) setServerItems([]);
    } finally {
      if (request === latestServerRequest.current) setRemoteLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(loadServerItems);
    if (!user) return;
    const requestRef = latestServerRequest;
    const source = createCommunityEventSource();
    const refresh = () => { void loadServerItems(); };
    source.addEventListener("open", refresh);
    source.addEventListener("postCreated", refresh);
    source.addEventListener("postUpdated", refresh);
    source.addEventListener("postRemoved", refresh);
    return () => { requestRef.current++; source.close(); };
  }, [user, loadServerItems]);

  useEffect(() => {
    if (sampleMode) return;
    const targets = savedItems.filter((item) => {
      const recipeId = recipeIdFromItem(item);
      return item.status === "published" && recipeId && !itemThumbnail(item) && !hydratedRecipeIds.current.has(recipeId);
    });
    if (targets.length === 0) return;

    let cancelled = false;
    targets.slice(0, 4).forEach(async (item) => {
      const recipeId = recipeIdFromItem(item);
      if (!recipeId) return;
      hydratedRecipeIds.current.add(recipeId);
      try {
        const recipe = await getRecipeById(recipeId);
        if (cancelled) return;
        const image = recipe.thumbnailUrl || getVideoThumbnailUrl(recipe.videoUrl);
        saveContentItem(owner, {
          ...item,
          title: recipe.title || item.title,
          description: recipe.content || item.description,
          recipe,
          image: image || item.image,
          minutes: (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) || item.minutes,
          updatedAt: item.updatedAt,
        });
      } catch {
        // Keep the existing local card when the API is unreachable.
      }
    });

    return () => { cancelled = true; };
  }, [owner, sampleMode, savedItems]);

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

  async function publishDraft(draft: VideoRecipeDraftResponse) {
    if (draft.status !== "READY" || publishingDraft) return;
    setPublishingDraft(true);
    setPublishError("");
    try {
      const result = await publishVideoRecipeDraft(draft.videoRecipeDraftId, { recipeName: draft.recipeName || draft.title || "Video recipe", categoryIds: [] });
      setAction(null);
      await loadServerItems();
      setNotice({ en: result.status === "PUBLISHED" ? "Post published." : "Saved as draft.", vi: result.status === "PUBLISHED" ? "Bài viết đã được AI duyệt và đăng." : result.moderationReason || "Bài chưa qua kiểm duyệt; đã giữ trong bản nháp." });
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : t("Could not publish the draft.", "Không đăng được bản nháp."));
    } finally {
      setPublishingDraft(false);
      setPendingPublish(null);
    }
  }

  async function publishManualDraft(item: MyContentItem) {
    const draft = item.draft;
    if (!draft || publishingDraft) return;
    setPublishingDraft(true);
    setPublishError("");
    try {
      const result = await createRecipe({
        title: draft.title.trim(), recipeName: (draft.recipeName || "").trim(), content: draft.content.trim(), videoUrl: null,
        prepMinutes: Number(draft.prepMinutes) || null, cookMinutes: Number(draft.cookMinutes) || null,
        servings: Number(draft.servings) || null, ingredients: draft.ingredients, steps: draft.steps,
        categoryIds: draft.selectedCategoryIds || [],
        ...(user?.role === "ADMIN" ? { bmiTypeIds: draft.selectedBmiTypeIds || [] } : {}),
      });
      removeManualContent(owner);
      setAction(null);
      await loadServerItems();
      setNotice({ en: result.status === "PUBLISHED" ? "Post published." : "Saved as draft.", vi: result.status === "PUBLISHED" ? "Bài viết đã được AI duyệt và đăng." : result.moderationReason || "Bài chưa qua kiểm duyệt; đã giữ trong bản nháp." });
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : t("Could not publish the draft.", "Không đăng được bản nháp."));
    } finally {
      setPublishingDraft(false);
      setPendingPublish(null);
    }
  }

  async function publishServerDraft(item: MyContentItem) {
    const id = recipeIdFromItem(item);
    if (!id || publishingDraft) return;
    setPublishingDraft(true);
    setPublishError("");
    try {
      if (item.postType === "RECIPE") {
        const recipe = item.recipe || await getRecipeById(id);
        const result = await updateRecipe(id, {
          title: recipe.title, recipeName: recipe.recipeName, content: recipe.content,
          videoUrl: recipe.videoUrl || null, prepMinutes: recipe.prepMinutes || null,
          cookMinutes: recipe.cookMinutes || null, servings: recipe.servings || null,
          ingredients: recipe.ingredients, steps: recipe.steps,
          categoryIds: recipe.categories.map(category => category.id),
          ...(user?.role === "ADMIN" ? { bmiTypeIds: recipe.bmiTypes?.map(type => type.id) || [] } : {}),
        });
        setNotice({ en: result.status === "PUBLISHED" ? "Post published." : "Saved as draft.", vi: result.status === "PUBLISHED" ? "Bài đã được AI duyệt và đăng." : result.moderationReason || "Bài vẫn ở bản nháp. Hãy chỉnh sửa và thử lại." });
      } else {
        await updatePost(id, { title: item.title, content: item.description, postType: (item.postType || "BLOG") as "BLOG", videoUrl: item.recipe?.videoUrl || null });
        setNotice({ en: "Moderation completed.", vi: "Đã gửi kiểm duyệt lại. Kiểm tra trạng thái bài viết." });
      }
      setAction(null);
      await loadServerItems();
    } catch (error) { setPublishError(error instanceof Error ? error.message : "Không thể gửi kiểm duyệt lại."); }
    finally { setPublishingDraft(false); }
  }

  async function deleteItem(item: MyContentItem) {
    try {
      if (sampleMode) setSamples((current) => current.filter((entry) => entry.id !== item.id));
      else if (item.videoDraft) {
        await deleteVideoRecipeDraft(item.videoDraft.videoRecipeDraftId);
        setServerItems((current) => current.filter((entry) => entry.id !== item.id));
      }
      else if (item.status === "draft" && item.draft) removeManualContent(owner);
      else if (item.status === "draft") {
        const id = recipeIdFromItem(item);
        if (!id) return;
        await deletePost(id);
        setServerItems(current => current.filter(entry => entry.id !== item.id));
      }
      else return;
      setAction(null);
      setStorageError(false);
      setNotice({ ...(sampleMode ? { en: "Sample post removed.", vi: "Đã xóa bài mẫu." } : { en: "Draft deleted.", vi: "Đã xóa bản nháp." }), ...(sampleMode || item.draft ? { undo: { item, sample: sampleMode, owner } } : {}) });
    } catch { setStorageError(true); }
  }

  function undoDelete() {
    const undo = notice?.undo;
    if (!undo || undo.owner !== owner) return;
    try {
      if (undo.sample) setSamples(current => current.some(item => item.id === undo.item.id) ? current : [undo.item, ...current]);
      else {
        if (parseMyContent(getMyContentSnapshot(owner)).some(item => item.id === undo.item.id)) {
          setNotice({ en: "A newer draft already exists. It has been kept.", vi: "Đã có bản nháp mới hơn. Bản nháp mới được giữ nguyên." });
          return;
        }
        saveContentItem(owner, undo.item);
      }
      setSource(undo.sample ? "sample" : "mine");
      resetFilters();
      setNotice({ en: "Post restored.", vi: "Đã khôi phục bài viết." });
    } catch {
      setNotice({ en: "Could not restore the draft. Check browser storage and retry.", vi: "Không thể khôi phục bản nháp. Kiểm tra bộ nhớ trình duyệt và thử lại.", tone: "error", undo });
    }
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
          <div className="flex items-start gap-2.5"><ContentIcon name="leaf" className="mt-1 shrink-0 text-[#658266]" /><p>{sampleMode ? t("You’re exploring sample content. Try the filters, preview, edit or delete a sample post.", "Bạn đang xem nội dung mẫu. Thử bộ lọc, xem trước, chỉnh sửa hoặc xóa bài mẫu.") : t("Published posts and video drafts come from your account. Manual drafts are saved in this browser.", "Bài đã đăng và bản nháp video lấy từ tài khoản của bạn. Bản nháp viết tay được lưu trên trình duyệt này.")}</p></div>
          {sampleMode && <button type="button" onClick={() => switchSource("mine")} className="inline-flex shrink-0 items-center gap-2 self-start font-semibold text-[#1E3A2F] hover:underline">{t("Go to my posts", "Đến bài của tôi")}<ContentIcon name="arrow" width="15" height="15" /></button>}
        </div>

        {draftLoadError && !sampleMode && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{t("Video drafts could not be loaded. Refresh to try again.", "Không tải được bản nháp video. Hãy tải lại trang để thử lại.")}</p>}
        <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#E5E7DF] pb-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5" aria-label={t("Content type", "Loại nội dung")}>
            {([{ value: "all", label: t("All posts", "Tất cả"), count: counts.all }, { value: "recipe", label: t("Recipes", "Công thức"), count: counts.recipe }, { value: "video", label: t("Videos & Recipes", "Video & Công thức"), count: counts.video }] as const).map((tab) => <button key={tab.value} type="button" aria-pressed={kind === tab.value} onClick={() => { setKind(tab.value); setPage(1); }} className={`vm-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition ${kind === tab.value ? "bg-[#1E3A2F] text-white" : "bg-[#F0F0E9] text-[#68766A] hover:bg-[#E8EDE4]"}`}>{tab.label}<span className={kind === tab.value ? "text-[#C3D5C8]" : "text-[#899388]"}>{tab.count}</span></button>)}
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

        {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`vm-feedback mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-[#CCDCCB] bg-[#E8F0E5] text-[#1E3A2F]"}`}><span>{t(notice.en, notice.vi)}</span><div className="flex items-center gap-4">{notice.undo?.owner === owner && <button type="button" onClick={undoDelete} className="vm-button font-semibold underline underline-offset-4">{t("Undo", "Hoàn tác")}</button>}<button type="button" onClick={() => setNotice(null)} aria-label={t("Dismiss notification", "Đóng thông báo")}><ContentIcon name="close" width="16" height="16" /></button></div></div>}

        {(loading || remoteLoading) && !sampleMode ? <CardSkeleton /> : visibleItems.length > 0 ? (
          <div className={layout === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
            {visibleItems.map((item) => {
              const text = displayText(item, language);
              const canEdit = sampleMode || item.status === "draft";
              const thumbnail = itemThumbnail(item);
              return <article key={item.id} className={`vm-card vm-enter group overflow-hidden rounded-2xl border border-[#E5E7DF] bg-white transition duration-200 hover:border-[#BBCAB7] hover:shadow-[0_8px_28px_#1E3A2F08] ${layout === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"}`}>
                <button type="button" onClick={() => setAction({ type: "preview", item })} aria-label={`${t("Preview", "Xem trước")}: ${text.title}`} className={`relative shrink-0 overflow-hidden bg-[#E8EDE4] ${layout === "list" ? "h-48 w-full sm:h-auto sm:min-h-44 sm:w-56" : "aspect-[16/9] w-full"}`}>
                  {thumbnail ? <FeedImage key={thumbnail} src={thumbnail} alt={text.title} compact={false} /> : <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,#D9E6DC,transparent)]"><ContentIcon name={item.kind === "video" ? "video" : "recipe"} width="64" height="64" className="text-[#8AA18B]" /></div>}
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
                      {canEdit && (sampleMode ? <button type="button" onClick={() => setAction({ type: "edit", item })} aria-label={`${t("Edit sample", "Sửa bài mẫu")}: ${text.title}`} title={t("Edit sample", "Sửa bài mẫu")} className="rounded-lg p-2 text-[#68766A] transition hover:bg-[#EDF3E9] hover:text-[#1E3A2F]"><ContentIcon name="edit" width="16" height="16" /></button> : item.postType && item.postType !== "RECIPE" ? <button type="button" onClick={() => setAction({ type: "edit", item })} aria-label={`Chỉnh sửa: ${text.title}`} className="rounded-lg p-2"><ContentIcon name="edit" width="16" height="16" /></button> : <Link href={item.videoDraft ? `/create-content?draft=video-${item.videoDraft.videoRecipeDraftId}` : item.draft ? "/create-content?draft=manual" : `/create-content?draft=${item.id}`} aria-label={`${t("Edit draft", "Chỉnh sửa bản nháp")}: ${text.title}`} title={t("Edit draft", "Chỉnh sửa bản nháp")} className="rounded-lg p-2 text-[#68766A] transition hover:bg-[#EDF3E9] hover:text-[#1E3A2F]"><ContentIcon name="edit" width="16" height="16" /></Link>)}
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

      {action?.type === "preview" && action.item.videoDraft && <ContentDialog title={t("Video draft", "Bản nháp video")} onClose={() => setAction(null)}><div className="space-y-4 p-6">
        <h3 className="font-serif text-2xl">{displayText(action.item, language).title}</h3>
        <p className="whitespace-pre-wrap text-sm text-[#647068]">{displayText(action.item, language).description}</p>
        {action.item.videoDraft.videoUrl && <video controls preload="metadata" src={action.item.videoDraft.videoUrl} className="w-full rounded-md" />}
        <p className="text-xs text-[#647068]">{({ PENDING: "Đang chờ", UPLOADING: "Đang tải video", PROCESSING: "Đang phân tích", READY: "Sẵn sàng", FAILED: "Thất bại", PUBLISHED: "Đã đăng" } as const)[action.item.videoDraft.status]}</p>
        {action.item.videoDraft.recipeName && <p className="text-sm"><strong>{t("Dish name", "Tên món ăn")}:</strong> {action.item.videoDraft.recipeName}</p>}
        {action.item.videoDraft.transcript && <section><h4 className="font-semibold">{t("Transcript", "Lời nói trong video")}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-[#647068]">{action.item.videoDraft.transcript}</p></section>}
        {action.item.videoDraft.ingredients.length > 0 && <section><h4 className="font-semibold">{t("Ingredients", "Nguyên liệu")}</h4><ul className="mt-1 space-y-1 text-sm text-[#647068]">{action.item.videoDraft.ingredients.map((ingredient, index) => <li key={index}>{ingredient.amount} {ingredient.ingredientName}</li>)}</ul></section>}
        {action.item.videoDraft.steps.length > 0 && <section><h4 className="font-semibold">{t("Steps", "Các bước nấu")}</h4><ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-[#647068]">{action.item.videoDraft.steps.map((step, index) => <li key={index}>{step.instruction}</li>)}</ol></section>}
        {action.item.videoDraft.errorMessage && <p role="alert" className="text-sm text-red-700">{action.item.videoDraft.errorMessage}</p>}
        {publishError && <p role="alert" className="text-sm text-red-700">{publishError}</p>}
        <div className="flex flex-wrap gap-2 border-t border-[#E5E7DF] pt-4">
          <Link href={`/create-content?draft=video-${action.item.videoDraft.videoRecipeDraftId}`} className={buttonClass}>{t("Edit draft", "Chỉnh sửa bản nháp")}</Link>
          {action.item.videoDraft.status === "READY" && <button type="button" disabled={publishingDraft} onClick={() => setPendingPublish({ kind: "video", draft: action.item.videoDraft! })} className="rounded-xl border border-[#1E3A2F] px-5 py-3 text-sm font-semibold text-[#1E3A2F] disabled:opacity-50">{publishingDraft ? t("Publishing...", "Đang đăng...") : t("Publish now", "Đăng bài")}</button>}
        </div>
      </div></ContentDialog>}
      {action?.type === "preview" && action.item.draft && !sampleMode && <ContentDialog title={t("Draft preview", "Bản nháp bài viết")} onClose={() => setAction(null)}><div className="space-y-4 p-6">
        <h3 className="font-serif text-2xl">{action.item.draft.title || t("Untitled recipe", "Công thức chưa có tên")}</h3>
        <p className="whitespace-pre-wrap text-sm text-[#647068]">{action.item.draft.content}</p>
        {action.item.draft.recipeName && <p className="text-sm"><strong>{t("Dish name", "Tên món ăn")}:</strong> {action.item.draft.recipeName}</p>}
        <section><h4 className="font-semibold">{t("Ingredients", "Nguyên liệu")}</h4><ul className="mt-1 space-y-1 text-sm text-[#647068]">{action.item.draft.ingredients.map((ingredient, index) => <li key={index}>{ingredient.amount} {ingredient.ingredientName}</li>)}</ul></section>
        <section><h4 className="font-semibold">{t("Cooking steps", "Các bước nấu")}</h4><ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-[#647068]">{action.item.draft.steps.map((step, index) => <li key={index}>{step.instruction}</li>)}</ol></section>
        {publishError && <p role="alert" className="text-sm text-red-700">{publishError}</p>}
        <div className="flex flex-wrap gap-2 border-t border-[#E5E7DF] pt-4">
          <Link href="/create-content?draft=manual" className={buttonClass}>{t("Edit draft", "Chỉnh sửa bản nháp")}</Link>
          <button type="button" disabled={publishingDraft || !action.item.draft.title.trim() || !action.item.draft.recipeName?.trim() || !action.item.draft.ingredients.some((ingredient) => ingredient.ingredientName.trim()) || !action.item.draft.steps.some((step) => step.instruction.trim())} onClick={() => setPendingPublish({ kind: "manual", item: action.item })} className="rounded-xl border border-[#1E3A2F] px-5 py-3 text-sm font-semibold text-[#1E3A2F] disabled:opacity-50">{publishingDraft ? t("Publishing...", "Đang đăng...") : t("Publish now", "Đăng bài")}</button>
        </div>
      </div></ContentDialog>}
      {action?.type === "preview" && !action.item.videoDraft && (!action.item.draft || sampleMode) && <ContentDialog title={t("Story preview", "Xem trước bài viết")} onClose={() => setAction(null)}><div className="p-6"><span className="text-xs font-semibold text-[#658266]">{action.item.kind === "video" ? t("Video & Recipe", "Video & Công thức") : t("Recipe", "Công thức")} · {action.item.status === "published" ? t("Published", "Đã đăng") : t("Draft", "Bản nháp")}</span><h3 className="mt-3 font-serif text-3xl">{displayText(action.item, language).title || t("Untitled recipe", "Công thức chưa có tên")}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#647068]">{displayText(action.item, language).description}</p>{action.item.recipe?.videoUrl && /^https?:\/\//i.test(action.item.recipe.videoUrl) && <video controls preload="metadata" poster={itemThumbnail(action.item)} src={action.item.recipe.videoUrl} className="mt-5 w-full rounded-xl" />}{(action.item.recipe || action.item.draft) && <><dl className="mt-5 border-b border-[#EFEEEB] pb-4"><dt className="text-xs font-semibold text-[#647068]">{t("Recipe name", "Tên món ăn")}</dt><dd className="mt-1 break-words text-lg font-semibold">{localizeRecipeTitle(action.item.recipe?.recipeName || action.item.draft?.recipeName, language) || t("Not provided", "Chưa có tên món ăn")}</dd></dl><h4 className="mt-6 font-serif text-xl">{t("Ingredients", "Nguyên liệu")}</h4><ul className="mt-3 space-y-2 text-sm text-[#647068]">{(action.item.recipe?.ingredients || action.item.draft?.ingredients || []).map((ingredient, index) => <li key={index}>• {localizeAmount(ingredient.amount, language)} {localizeIngredient(ingredient.ingredientName, language)}</li>)}</ul><h4 className="mt-6 font-serif text-xl">{t("Cooking steps", "Các bước nấu")}</h4><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#647068]">{(action.item.recipe?.steps || action.item.draft?.steps || []).map((step, index) => <li key={index}>{localizeText(step.instruction, language)}</li>)}</ol></>}{action.item.status === "draft" && !sampleMode && <div className="mt-5 space-y-3"><p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{action.item.moderationReason || "Bài đang được giữ ở bản nháp. Chỉnh sửa rồi gửi kiểm duyệt lại."}</p>{publishError && <p role="alert" className="text-sm text-red-700">{publishError}</p>}<div className="flex gap-3">{action.item.postType === "RECIPE" ? <Link className={buttonClass} href={`/create-content?draft=${action.item.id}`}>Chỉnh sửa bản nháp</Link> : <button type="button" className={buttonClass} onClick={() => setAction({ type: "edit", item: action.item })}>Chỉnh sửa bản nháp</button>}<button type="button" disabled={publishingDraft} onClick={() => void publishServerDraft(action.item)} className="rounded-xl border px-5 py-3 text-sm font-semibold disabled:opacity-50">{publishingDraft ? "Đang kiểm duyệt..." : "Gửi duyệt và đăng"}</button></div></div>}{sampleMode && <p className="mt-6 rounded-xl bg-[#ECF0E5] p-3 text-xs leading-6 text-[#647068]">{t("This is a sample story for the interface preview. Video playback and full recipe details are available for your own published content.", "Đây là bài mẫu để xem trước giao diện. Video và chi tiết công thức sẽ có trong nội dung thật của bạn.")}</p>}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setAction(null)} className={buttonClass}>{t("Done", "Đóng")}</button></div></div></ContentDialog>}

      {action?.type === "edit" && sampleMode && <SampleEditDialog key={action.item.id} item={action.item} onClose={() => setAction(null)} onSave={(next) => { setSamples((current) => current.map((item) => item.id === next.id ? next : item)); setAction(null); setNotice({ en: "Sample changes saved for this preview session.", vi: "Đã lưu thay đổi bài mẫu trong phiên xem trước này." }); }} />}
      {action?.type === "edit" && !sampleMode && action.item.postType !== "RECIPE" && <ServerPostEditDialog key={action.item.id} item={action.item} onClose={() => setAction(null)} onSaved={async () => { setAction(null); await loadServerItems(); setNotice({ en: "Moderation completed.", vi: "Đã gửi kiểm duyệt lại. Kiểm tra trạng thái bài viết." }); }} />}

      {action?.type === "delete" && <ContentDialog title={sampleMode ? t("Delete sample post?", "Xóa bài mẫu?") : t("Delete this draft?", "Xóa bản nháp này?")} onClose={() => setAction(null)}>
        <div className="p-6">
          <p className="text-sm leading-7 text-[#647068]">{sampleMode
            ? t("This removes the sample from your preview session. Reloading restores it.", "Bài mẫu sẽ xuất hiện lại sau khi tải lại trang.")
            : action.item.videoDraft
              ? t("This removes the video draft from your account and cannot be undone.", "Bản nháp video sẽ bị xóa khỏi tài khoản và không thể hoàn tác.")
              : t("This removes the draft from this browser. You can undo from the confirmation message.", "Bản nháp sẽ bị xóa khỏi trình duyệt. Bạn có thể hoàn tác trong thông báo xác nhận.")}</p>
          <p className="mt-4 rounded-xl bg-[#F0F0E9] p-4 font-serif text-xl">{displayText(action.item, language).title || t("Untitled recipe", "Công thức chưa có tên")}</p>
          {storageError && <p role="alert" className="mt-4 text-sm text-red-600">{t("Could not delete the draft. Please try again.", "Không thể xóa bản nháp. Hãy thử lại.")}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setAction(null)} className="rounded-xl border border-[#E5E7DF] px-5 py-3 text-sm font-semibold hover:bg-[#E8EDE4]">{t("Keep it", "Giữ lại")}</button><button type="button" onClick={() => void deleteItem(action.item)} className="inline-flex items-center gap-2 rounded-xl bg-[#A24635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#883727]"><ContentIcon name="trash" width="16" height="16" />{t("Delete", "Xóa")}</button></div>
        </div>
      </ContentDialog>}
      <ConfirmDialog open={pendingPublish !== null} title={t("Publish this draft?", "Đăng bản nháp này?")} description={t("The content will be checked again before it becomes visible to the community.", "Nội dung sẽ được kiểm duyệt lại trước khi hiển thị với cộng đồng.")} confirmLabel={t("Publish", "Đăng bài")} busy={publishingDraft} onClose={() => setPendingPublish(null)} onConfirm={() => { if (pendingPublish?.kind === "video") void publishDraft(pendingPublish.draft); else if (pendingPublish?.kind === "manual") void publishManualDraft(pendingPublish.item); }} />
    </div>
  );
}

function ServerPostEditDialog({ item, onClose, onSaved }: { item: MyContentItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.description);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <ContentDialog title="Chỉnh sửa bản nháp" onClose={onClose}><form className="space-y-4 p-6" onSubmit={async event => {
    event.preventDefault();
    const id = recipeIdFromItem(item);
    if (!id) return;
    setBusy(true); setError("");
    try { await updatePost(id, { title: title.trim(), content: content.trim(), postType: (item.postType || "BLOG") as "BLOG", videoUrl: item.recipe?.videoUrl || null }); await onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu bài viết."); }
    finally { setBusy(false); }
  }}><label className="block text-sm font-semibold">Tiêu đề<input required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-semibold">Nội dung<textarea required rows={6} value={content} onChange={event => setContent(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={busy} className={buttonClass}>{busy ? "Đang kiểm duyệt..." : "Lưu và gửi kiểm duyệt"}</button></form></ContentDialog>;
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
