"use client";

import UiText, { useUiText } from "@/components/UiText";
import PostComposer from "@/components/content/PostComposer";
import DietSelector from "@/components/recipe/DietSelector";
import UploadProgress from "@/components/ui/UploadProgress";
import { useLanguage } from "@/context/LanguageContext";
import type { PostType } from "@/lib/post-api";


import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/auth";
import { getMediaUrl } from "@/lib/api";
import { readMyContent, saveManualContent, removeManualContent, rememberPublishedContent } from "@/lib/my-content";
import {
  CategoryItem,
  AllergenItem,
  TagItem,
  DietTypeItem,
  DietaryGroup,
  RecipeIngredientPayload,
  RecipeStepPayload,
  RecipeResponse,
  VideoDraftStatus,
  VideoRecipeDraftResponse,
  getCategories,
  getAllergens,
  getTags,
  getDietTypes,
  createRecipe,
  uploadVideoRecipeDraft,
  getVideoRecipeDraft,
  updateVideoRecipeDraft,
  publishVideoRecipeDraft,
  retryVideoRecipeDraft,
  isDietCompatible,
} from "@/lib/recipe-api";

const DIETARY_GROUPS: { value: DietaryGroup; label: string; desc: string }[] = [
  { value: "PLANT", label: "Plant", desc: "100% gốc thực vật" },
  { value: "DAIRY", label: "Dairy", desc: "Bơ, sữa chua, phô mai..." },
  { value: "EGG", label: "Egg", desc: "Trứng gà, vịt..." },
  { value: "HONEY", label: "Honey", desc: "Mật ong tự nhiên" },
];

const subscribeHydration = () => () => {};

export default function CreateContentView() {
  const { t } = useLanguage();
  const [kind, setKind] = useState<PostType | "RECIPE">("RECIPE");
  const choices: { value: PostType | "RECIPE"; label: string }[] = [
    { value: "RECIPE", label: t("Recipe", "Công thức") },
    { value: "BLOG", label: t("Blog post", "Bài chia sẻ") },
    { value: "QUESTION", label: t("Question", "Câu hỏi") },
    { value: "VIDEO", label: t("Video post", "Bài video") },
  ];
  return <>
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
      <fieldset className="mb-6"><legend className="mb-3 text-sm font-semibold text-[#07241A]">{t("What would you like to create?", "Bạn muốn tạo nội dung gì?")}</legend><div className="flex flex-wrap gap-2">{choices.map(choice => <label key={choice.value} className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-semibold ${kind === choice.value ? "border-[#254B38] bg-[#254B38] text-white" : "border-[#E5E7DF] bg-white text-[#424844]"}`}><input type="radio" name="content-kind" value={choice.value} checked={kind === choice.value} onChange={() => setKind(choice.value)} className="peer sr-only" /><span className="peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4">{choice.label}</span></label>)}</div></fieldset>
    </div>
    <div hidden={kind !== "RECIPE"}><RecipeContentView /></div>
    <div hidden={kind === "RECIPE"}><PostComposer postType={kind === "RECIPE" ? "BLOG" : kind} /></div>
  </>;
}

function RecipeContentView() {
  const { t } = useLanguage();
  const ui = useUiText();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const contentOwner = user?.uid || "guest";
  const isMounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const token = typeof window !== "undefined" ? getStoredToken() : null;
  const isLoggedIn = isMounted && (!!user || !!token);

  // Mode: "ai" vs "manual"
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");


  // Master data
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allergens, setAllergens] = useState<AllergenItem[]>([]);
  const [, setTags] = useState<TagItem[]>([]);
  const [dietTypes, setDietTypes] = useState<DietTypeItem[]>([]);
  const [, setIsLoadingMasterData] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [prepMinutes, setPrepMinutes] = useState<string>("20");
  const [cookMinutes, setCookMinutes] = useState<string>("15");
  const [servings, setServings] = useState<string>("2");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedDietTypeIds, setSelectedDietTypeIds] = useState<number[]>([]);

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredientPayload[]>([
    { ingredientName: "", amount: "", dietaryGroup: "PLANT", allergenId: null },
  ]);
  const [steps, setSteps] = useState<RecipeStepPayload[]>([
    { stepNumber: 1, instruction: "" },
  ]);

  // AI Video Draft State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<VideoDraftStatus | null>(null);
  const [draftErrorMessage, setDraftErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  // UI status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  useEffect(() => () => uploadAbort.current?.abort(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [publishedResult, setPublishedResult] = useState<RecipeResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (statusMessage) statusRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }, [statusMessage]);
  const restoredDraftRef = useRef(false);

  useEffect(() => {
    if (authLoading || restoredDraftRef.current || new URLSearchParams(window.location.search).get("draft") !== "manual") return;
    let cancelled = false;
    // Load the browser draft after hydration, without blocking the first render.
    Promise.resolve().then(() => {
      if (cancelled) return;
      const draft = readMyContent(contentOwner).find((item) => item.id === "manual-draft")?.draft;
      if (!draft) return;
      restoredDraftRef.current = true;
      setCreationMode("manual");
      setTitle(draft.title);
      setContent(draft.content);
      setCategoryId(draft.categoryId);
      setPrepMinutes(draft.prepMinutes);
      setCookMinutes(draft.cookMinutes);
      setServings(draft.servings);
      setIngredients(draft.ingredients);
      setSteps(draft.steps);
      setSelectedTagIds(draft.selectedTagIds);
      setSelectedDietTypeIds(draft.selectedDietTypeIds || []);
    });
    return () => { cancelled = true; };
  }, [authLoading, contentOwner]);

  // Load master data on mount
  useEffect(() => {
    async function fetchMaster() {
      setIsLoadingMasterData(true);
      try {
        const [catData, allData, tagData, dietData] = await Promise.all([
          getCategories(),
          getAllergens(),
          getTags(),
          getDietTypes(),
        ]);
        setCategories(catData);
        setAllergens(allData);
        setTags(tagData);
        setDietTypes(dietData);

        if (catData.length > 0 && !restoredDraftRef.current) {
          setCategoryId(catData[0].id);
        }
      } catch {
        // Handled silently
      } finally {
        setIsLoadingMasterData(false);
      }
    }
    fetchMaster();
  }, []);

  // Poll draft status
  const pollDraft = useCallback(
    async (id: number) => {
      try {
        const res: VideoRecipeDraftResponse = await getVideoRecipeDraft(id);
        setDraftStatus(res.status);
        setDraftErrorMessage(res.errorMessage || null);

        if (res.videoUrl && !videoPreviewUrl) {
          setVideoPreviewUrl(getMediaUrl(res.videoUrl));
        }

        if (res.status === "READY") {
          // Stop polling and fill form
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          if (res.title) setTitle(res.title);
          if (res.description) setContent(res.description);
          if (res.estimatedPrepMinutes !== null && res.estimatedPrepMinutes !== undefined) {
            setPrepMinutes(String(res.estimatedPrepMinutes));
          }
          if (res.transcript) setTranscript(res.transcript);
          if (res.ingredients && res.ingredients.length > 0) {
            setIngredients(res.ingredients);
          }
          if (res.steps && res.steps.length > 0) {
            setSteps(
              res.steps.map((st, idx) => ({
                stepNumber: idx + 1,
                instruction: st.instruction,
              }))
            );
          }

          setStatusMessage({
            type: "success",
            text: "AI đã hoàn tất phân tích video và tạo bản nháp thành công! Vui lòng kiểm tra lại bên dưới.",
          });
        } else if (res.status === "FAILED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setStatusMessage({
            type: "error",
            text: res.errorMessage || "Xử lý video thất bại. Bạn có thể nhấn Thử lại.",
          });
        } else if (res.status === "PUBLISHED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch {
        // Polling failure
      }
    },
    [videoPreviewUrl]
  );

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle Video file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadAbort.current) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 100 MB
    if (file.size > 100 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Kích thước video tối đa 100 MB. Vui lòng chọn tệp nhỏ hơn.",
      });
      return;
    }

    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);
    setDraftId(null);
    setDraftStatus(null);
    setDraftErrorMessage(null);
    setStatusMessage(null);
  };

  // Upload and trigger AI draft generation
  const handleGenerateDraft = async () => {
    if (uploadAbort.current) return;
    if (!videoFile) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng chọn tệp video trước khi bấm Generate draft.",
      });
      return;
    }

    if (!token) {
      setStatusMessage({
        type: "error",
        text: "Bạn cần đăng nhập để sử dụng tính năng tạo công thức AI từ video.",
      });
      return;
    }

    const controller = new AbortController();
    uploadAbort.current = controller;
    setUploadPercent(0);
    setDraftStatus(null);
    setDraftErrorMessage(null);
    setIsUploading(true);
    setStatusMessage({
      type: "info",
      text: "Đang tải video lên máy chủ... Vui lòng không đóng trang.",
    });

    try {
      const res = await uploadVideoRecipeDraft(videoFile, { onProgress: setUploadPercent, signal: controller.signal });
      setDraftId(res.videoRecipeDraftId);
      setDraftStatus(res.status);
      setStatusMessage({
        type: "info",
        text: "Đã tải lên video thành công! VeggieAI đang phân tích âm thanh và các bước nấu...",
      });

      // Start polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        pollDraft(res.videoRecipeDraftId);
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatusMessage({ type: "info", text: "Upload cancelled." });
        return;
      }
      const msg = err instanceof Error ? err.message : "Tải lên video thất bại";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      uploadAbort.current = null;
      setIsUploading(false);
    }
  };

  // Retry failed draft
  const handleRetryDraft = async () => {
    if (!draftId) return;
    try {
      setStatusMessage({ type: "info", text: "Đang thử lại phân tích..." });
      const res = await retryVideoRecipeDraft(draftId);
      setDraftStatus(res.status);
      setDraftErrorMessage(null);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        pollDraft(draftId);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thử lại thất bại";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  // Ingredients operations
  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientName: "",
        amount: "",
        dietaryGroup: "PLANT",
        allergenId: null,
      },
    ]);
  };

  const handleUpdateIngredient = <Field extends keyof RecipeIngredientPayload>(
    index: number,
    field: Field,
    value: RecipeIngredientPayload[Field]
  ) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Cooking steps operations
  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        instruction: "",
      },
    ]);
  };

  const handleUpdateStep = (index: number, instruction: string) => {
    setSteps((prev) =>
      prev.map((st, i) => (i === index ? { ...st, instruction } : st))
    );
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((st, i) => ({ ...st, stepNumber: i + 1 }))
    );
  };

  // Save Draft action
  const handleSaveDraft = async () => {
    setStatusMessage(null);

    if (creationMode === "ai") {
      // Call PUT /api/video-recipe-drafts/{id}
      if (!draftId) {
        setStatusMessage({
          type: "error",
          text: "Chưa có bản nháp video nào được tạo để lưu.",
        });
        return;
      }
      if (draftStatus !== "READY") {
        setStatusMessage({
          type: "error",
          text: "Chỉ có thể chỉnh sửa và lưu khi bản nháp ở trạng thái READY.",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await updateVideoRecipeDraft(draftId, {
          title: title.trim() || "Untitled Recipe",
          description: content.trim(),
          transcript: transcript,
          estimatedPrepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : null,
          ingredients,
          steps,
        });
        setStatusMessage({
          type: "success",
          text: "Đã lưu bản nháp video thành công vào máy chủ!",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi lưu bản nháp video";
        setStatusMessage({ type: "error", text: msg });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Manual mode: Save to localStorage as BE doesn't have draft endpoint for manual recipes
      const manualDraft = {
        title,
        content,
        categoryId,
        prepMinutes,
        cookMinutes,
        servings,
        ingredients,
        steps,
        selectedTagIds,
        selectedDietTypeIds,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("veggie_manual_recipe_draft", JSON.stringify(manualDraft));
        saveManualContent(contentOwner, manualDraft);
        setStatusMessage({
          type: "success",
          text: "Đã lưu bản nháp công thức vào bộ nhớ trình duyệt!",
        });
      } catch {
        setStatusMessage({
          type: "error",
          text: "Không thể lưu bản nháp vào bộ nhớ trình duyệt.",
        });
      }
    }
  };

  // Publish Recipe
  const handlePublish = async () => {
    if (isSubmitting) return;
    setPublishedResult(null);
    if (!token) {
      setStatusMessage({
        type: "error",
        text: "Bạn cần đăng nhập để xuất bản công thức.",
      });
      return;
    }

    if (!title.trim()) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng nhập tên công thức món ăn.",
      });
      return;
    }

    if (ingredients.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng thêm ít nhất 1 nguyên liệu.",
      });
      return;
    }

    if (steps.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng thêm ít nhất 1 bước nấu.",
      });
      return;
    }

    if (!hasReviewed) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng đánh dấu xác nhận bạn đã kiểm tra các nguyên liệu và bước nấu.",
      });
      return;
    }

    const filledIngredients = ingredients.filter(ingredient => ingredient.ingredientName.trim());
    if (dietTypes.some(diet => selectedDietTypeIds.includes(diet.id) && !isDietCompatible(diet, filledIngredients))) {
      setStatusMessage({ type: "error", text: t("Adjust ingredients to match your selected diets, or deselect those diets before publishing.", "Điều chỉnh nguyên liệu cho phù hợp hoặc bỏ chế độ ăn đã chọn trước khi đăng.") });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (creationMode === "ai") {
        if (!draftId) {
          throw new Error("Chưa có bản nháp video AI để xuất bản.");
        }
        if (draftStatus !== "READY") {
          throw new Error("Bản nháp AI chưa sẵn sàng (READY) để xuất bản.");
        }

        // Step 1: Save draft modifications via PUT
        await updateVideoRecipeDraft(draftId, {
          title: title.trim(),
          description: content.trim(),
          transcript: transcript,
          estimatedPrepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : null,
          ingredients,
          steps,
        });

        // Step 2: Publish via POST /api/video-recipe-drafts/{id}/publish
        const published = await publishVideoRecipeDraft(draftId, {
          categoryId: categoryId,
          tagIds: selectedTagIds,
        });

        setPublishedResult(published);
        try { rememberPublishedContent(contentOwner, published, "video"); } catch { /* Publishing already succeeded. */ }
        setStatusMessage({
          type: "success",
          text: "Recipe published successfully.",
        });
      } else {
        // Manual mode: POST /api/recipes
        const payload = {
          title: title.trim(),
          content: content.trim(),
          categoryId: categoryId,
          videoUrl: videoPreviewUrl || null,
          prepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : null,
          cookMinutes: cookMinutes ? parseInt(cookMinutes, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
          ingredients,
          steps,
          tagIds: selectedTagIds,
        };

        const res = await createRecipe(payload);
        setPublishedResult(res);
        try {
          rememberPublishedContent(contentOwner, res, "recipe");
          removeManualContent(contentOwner);
        } catch { /* Publishing already succeeded. */ }
        // Clear local manual draft
        localStorage.removeItem("veggie_manual_recipe_draft");

        setStatusMessage({
          type: "success",
          text: "Recipe published successfully.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng công thức thất bại";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFEEEB] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#99462A]">
              <span>✒️</span>
              <span><UiText text={"EDITORIAL WORKBENCH"} /></span>
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#07241A] sm:text-4xl"><UiText text={"Create Content"} /></h1>
          <p className="mt-1 text-sm text-[#424844]"><UiText text={"Share your plant-based recipe with the community."} /></p>
        </div>


      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          ref={statusRef}
          role={statusMessage.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`my-6 rounded-2xl p-4 text-xs font-medium border shadow-xs transition animate-fade-in ${
            statusMessage.type === "success"
              ? "bg-[#D9E6DC] text-[#07241A] border-[#CAEADA]"
              : statusMessage.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">
                {statusMessage.type === "success"
                  ? "✓"
                  : statusMessage.type === "error"
                  ? "⚠️"
                  : "ℹ️"}
              </span>
              <div><UiText text={statusMessage.text} />{publishedResult && statusMessage.type === "success" && <p className="mt-1 break-words">{publishedResult.title} · #{publishedResult.postId}</p>}</div>
            </div>
            {publishedResult && (
              <Link
                href="/my-content"
                className="underline font-bold hover:text-black ml-4"
              ><UiText text={"Xem bài viết"} /></Link>
            )}
          </div>
        </div>
      )}

      {/* Auth Warning if not logged in */}
      {isMounted && !isLoggedIn && (
        <div className="my-6 rounded-2xl bg-[#F5F3F0] p-4 text-xs text-[#07241A] border border-[#EFEEEB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span><UiText text={"You are browsing as a guest. Sign in to save drafts and publish recipes."} /></span>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A2F]"
          ><UiText text={"Đăng nhập"} /></Link>
        </div>
      )}

      {/* ── STEP 1: CHOOSE HOW TO CREATE ───────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
          <span className="text-xs font-bold tracking-wider text-[#727974] uppercase"><UiText text={"STEP 1: CHOOSE HOW TO CREATE"} /></span>
          <span className="text-xs text-[#727974]"><UiText text={"Step 1 of 4"} /></span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card: Generate with AI */}
          <div
            onClick={() => setCreationMode("ai")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              creationMode === "ai"
                ? "border-[#07241A] bg-[#F5F3F0]/60 shadow-xs"
                : "border-[#EFEEEB] bg-white hover:border-[#D9E6DC]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm ${
                      creationMode === "ai"
                        ? "bg-[#07241A] text-white"
                        : "bg-[#EFEEEB] text-[#07241A]"
                    }`}
                  >
                    ✨
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Generate with AI"} /></h3>
                </div>
                <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#99462A]"><UiText text={"Recommended"} /></span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#424844]"><UiText text={"Upload a cooking video. AI creates an editable draft of ingredients and steps for you to review."} /></p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <span><UiText text={"Tự động nhận diện nguyên liệu & công thức"} /></span>
              <span>→</span>
            </div>
          </div>

          {/* Card: Write Manually */}
          <div
            onClick={() => setCreationMode("manual")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              creationMode === "manual"
                ? "border-[#07241A] bg-[#F5F3F0]/60 shadow-xs"
                : "border-[#EFEEEB] bg-white hover:border-[#D9E6DC]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm ${
                      creationMode === "manual"
                        ? "bg-[#07241A] text-white"
                        : "bg-[#EFEEEB] text-[#07241A]"
                    }`}
                  >
                    ✍️
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Write Manually"} /></h3>
                </div>
                <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#727974]"><UiText text={"Standard"} /></span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#424844]"><UiText text={"Enter ingredients, measurements, and cooking technique manually. Video attachment remains completely optional."} /></p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <span><UiText text={"Tự do điều chỉnh toàn bộ chi tiết"} /></span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Recipe details ─────────────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
              📝
            </span>
            <h2 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Recipe details"} /></h2>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-[#99462A] uppercase"><UiText text={"REQUIRED DETAILS"} /></span>
        </div>

        <div className="mt-6 space-y-5">
          {/* Recipe Title */}
          <div>
            <label className="block text-xs font-semibold text-[#07241A]"><UiText text={"Recipe title"} />{" "}<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ui("e.g. Easy Tofu in Tomato Sauce")}
              className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 text-sm text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>

          {/* Category, Prep Minutes, Servings */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#07241A]"><UiText text={"Category"} />{" "}<span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId ?? ""}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2.5 text-xs text-[#07241A] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {<UiText text={c.name} />}
                  </option>
                ))}
              </select>
            </div>

            {/* Preparation time */}
            <div>
              <label className="block text-xs font-semibold text-[#07241A]"><UiText text={"Preparation time (minutes)"} /></label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="1"
                  value={prepMinutes}
                  onChange={(e) => setPrepMinutes(e.target.value)}
                  placeholder="20"
                  className="w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 pl-8 text-xs text-[#07241A] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
                />
                <span className="absolute left-2.5 top-3 text-xs text-[#727974]">
                  ⏱️
                </span>
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-xs font-semibold text-[#07241A]"><UiText text={"Servings"} />{creationMode === "ai" && (
                  <span className="ml-1 text-[10px] text-[#727974] font-normal"><UiText text={"(Manual only)"} /></span>
                )}
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="2"
                  className="w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 pl-8 text-xs text-[#07241A] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
                />
                <span className="absolute left-2.5 top-3 text-xs text-[#727974]">
                  👥
                </span>
              </div>
            </div>
          </div>

          {/* Story & flavor profile */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#07241A]"><UiText text={"Dish description"} /></label>
              <span className="text-[11px] text-[#727974]">
                {content.length} / 500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={ui("A comforting home-cooked dish featuring pan-seared golden tofu braised in a fresh, savory tomato reduction...")}
              className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-xs text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* ── Section: Cooking video (AI mode) ───────────────────────── */}
      {creationMode === "ai" && (
        <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
          <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
                🎥
              </span>
              <h2 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Cooking video"} /></h2>
            </div>
            <span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#1E3A2F]"><UiText text={"AI POWERED EXTRACTION"} /></span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#07241A]"><UiText text={"Upload cooking video"} /></span>
              <span className="text-[#727974]"><UiText text={"MP4, MOV, WEBM, AVI (up to 100 MB)"} /></span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              disabled={isUploading}
              accept="video/mp4,video/quicktime,video/webm,video/avi"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Uploaded card / Dropzone */}
            {!videoFile && !videoPreviewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EFEEEB] bg-[#FBF9F6] p-8 text-center cursor-pointer hover:border-[#07241A] transition"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFEEEB] text-2xl text-[#07241A]">
                  📁
                </div>
                <p className="mt-3 text-xs font-semibold text-[#07241A]"><UiText text={"Choose a cooking video from your device"} /></p>
                <p className="mt-1 text-[11px] text-[#727974]"><UiText text={"Supports MP4, MOV, WEBM or AVI (under 100 MB)"} /></p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Video player preview */}
                  <div className="relative overflow-hidden rounded-xl bg-black aspect-video sm:col-span-1 shadow-xs">
                    {videoPreviewUrl && (
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Metadata & Status */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#07241A] truncate max-w-xs">
                        {videoFile?.name || "Uploaded video"}
                      </span>
                      {draftStatus === "READY" ? (
                        <span className="rounded-full bg-[#D9E6DC] px-2.5 py-0.5 text-[10px] font-bold text-[#07241A]"><UiText text={"✓ Ready"} /></span>
                      ) : draftStatus === "PROCESSING" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse"><UiText text={"⚙️ Đang phân tích..."} /></span>
                      ) : draftStatus === "PENDING" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700"><UiText text={"⏳ Chờ xử lý"} /></span>
                      ) : draftStatus === "FAILED" ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700"><UiText text={"✕ Lỗi xử lý"} /></span>
                      ) : (
                        <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#727974]"><UiText text={"Chưa gửi phân tích"} /></span>
                      )}
                    </div>

                    {videoFile && (
                      <p className="text-[11px] text-[#727974]">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
                        {videoFile.type || "video"}
                      </p>
                    )}

                    {draftErrorMessage && (
                      <p className="text-xs text-red-600 font-medium">
                        {<UiText text={draftErrorMessage} />}
                      </p>
                    )}

                    {/* Actions on video */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#424844] hover:bg-[#F5F3F0] transition"
                      ><UiText text={"Replace video"} /></button>
                      {draftStatus === "FAILED" && (
                        <button
                          type="button"
                          onClick={handleRetryDraft}
                          className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A2F] transition"
                        ><UiText text={"Retry analysis"} /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generate draft button */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isUploading || !videoFile || draftStatus === "PROCESSING" || draftStatus === "PENDING"}
                className="flex items-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>✨</span>
                <span>
                  {isUploading
                    ? ui("Đang tải video...")
                    : draftStatus === "PROCESSING"
                    ? ui("AI đang phân tích...")
                    : ui("Generate draft")}
                </span>
              </button>
              <span className="text-[11px] text-[#727974] italic"><UiText text={"AI draft - review required before publishing"} /></span>
            </div>
          </div>
          {(isUploading || draftStatus === "PENDING" || draftStatus === "PROCESSING") && <UploadProgress percent={uploadPercent} processing={!isUploading} onCancel={() => uploadAbort.current?.abort()} />}
        </section>
      )}

      {/* ── Section: Ingredients ────────────────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFEEEB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
                🥗
              </span>
              <h2 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Ingredients"} /></h2>
            </div>
            <p className="mt-0.5 text-xs text-[#727974]"><UiText text={"Edit quantities, ingredient names, and verify pantry provenance."} /></p>
          </div>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/40 transition self-start sm:self-auto cursor-pointer"
          >
            <span>+</span>
            <span><UiText text={"Add ingredient"} /></span>
          </button>
        </div>

        {/* Ingredients list */}
        <div className="mt-6 space-y-3">
          {ingredients.map((ing, index) => {
            const isNonPlant = ing.dietaryGroup !== "PLANT";
            return (
              <div
                key={index}
                className="rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 space-y-2 transition focus-within:border-[#1E3A2F] focus-within:bg-white"
              >
                <div className="grid grid-cols-12 gap-2.5 items-center">
                  {/* Amount */}
                  <div className="col-span-12 sm:col-span-3">
                    <input
                      type="text"
                      value={ing.amount || ""}
                      onChange={(e) =>
                        handleUpdateIngredient(index, "amount", e.target.value)
                      }
                      placeholder={ui("e.g. 400 g / 2 tbsp")}
                      className="w-full rounded-xl border border-[#EFEEEB] bg-white px-3 py-2 text-xs text-[#07241A] outline-none"
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      value={ing.ingredientName}
                      onChange={(e) =>
                        handleUpdateIngredient(
                          index,
                          "ingredientName",
                          e.target.value
                        )
                      }
                      placeholder={ui("Ingredient name (e.g. tofu)")}
                      className="w-full rounded-xl border border-[#EFEEEB] bg-white px-3 py-2 text-xs text-[#07241A] outline-none"
                    />
                  </div>

                  {/* Dietary group (REQUIRED) */}
                  <div className="col-span-6 sm:col-span-2">
                    <select
                      value={ing.dietaryGroup}
                      onChange={(e) =>
                        handleUpdateIngredient(
                          index,
                          "dietaryGroup",
                          e.target.value as DietaryGroup
                        )
                      }
                      className="w-full rounded-xl border border-[#EFEEEB] bg-white px-2 py-2 text-xs text-[#07241A] outline-none font-medium"
                    >
                      {DIETARY_GROUPS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {<UiText text={g.label} />}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Allergen dropdown (optional) */}
                  <div className="col-span-5 sm:col-span-2">
                    <select
                      value={ing.allergenId ?? ""}
                      onChange={(e) =>
                        handleUpdateIngredient(
                          index,
                          "allergenId",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full rounded-xl border border-[#EFEEEB] bg-white px-2 py-2 text-xs text-[#727974] outline-none"
                    >
                      <option value=""><UiText text={"(Không dị ứng)"} /></option>
                      {allergens.map((al) => (
                        <option key={al.id} value={al.id}>
                          {<UiText text={al.name} />}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delete button */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-[#727974] hover:text-red-600 transition p-1"
                      title={ui("Xóa nguyên liệu")}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Non-plant clarification warning */}
                {isNonPlant && (
                  <div className="rounded-xl bg-[#FDE8E4] px-3 py-1.5 text-[11px] text-[#99462A] flex items-center justify-between">
                    <span><UiText text={"⚠️ Nhóm nguyên liệu"} />{" "}<strong>{ui(DIETARY_GROUPS.find(group => group.value === ing.dietaryGroup)?.label || ing.dietaryGroup)}</strong>{" "}<UiText text={"affects vegan diet compatibility."} /></span>
                    <span className="font-semibold text-[10px] uppercase"><UiText text={"Needs Clarification"} /></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <DietSelector diets={dietTypes} ingredients={ingredients} selectedIds={selectedDietTypeIds} onChange={setSelectedDietTypeIds} />

      {/* ── Section: Cooking steps ──────────────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFEEEB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
                🍳
              </span>
              <h2 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Cooking steps"} /></h2>
            </div>
            <p className="mt-0.5 text-xs text-[#727974]"><UiText text={"Step-by-step guidance formatted with culinary precision."} /></p>
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/40 transition self-start sm:self-auto cursor-pointer"
          >
            <span>+</span>
            <span><UiText text={"Add step"} /></span>
          </button>
        </div>

        {/* Steps list */}
        <div className="mt-6 space-y-4">
          {steps.map((st, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-4 space-y-2 transition focus-within:border-[#1E3A2F] focus-within:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#07241A] text-xs font-bold text-white">
                    {st.stepNumber}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#07241A]"><UiText text={"BƯỚC"} />{" "}{st.stepNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="text-xs text-[#727974] hover:text-red-600 transition p-1"
                  title={ui("Xóa bước này")}
                ><UiText text={"✕ Xóa"} /></button>
              </div>
              <textarea
                rows={2}
                value={st.instruction}
                onChange={(e) => handleUpdateStep(index, e.target.value)}
                placeholder={ui("Mô tả kỹ thuật nấu, lửa và thời gian cho bước này...")}
                className="w-full rounded-xl border border-[#EFEEEB] bg-white p-3 text-xs text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom confirmation & Actions ───────────────────────────────── */}
      <div className="mt-8 space-y-4">
        {/* Checkbox confirmation */}
        <div className="rounded-2xl bg-[#FDE8E4]/60 border border-[#FDE8E4] p-4 flex items-start gap-3">
          <input
            id="review-checkbox"
            type="checkbox"
            checked={hasReviewed}
            onChange={(e) => setHasReviewed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#99462A] text-[#07241A] focus:ring-[#1E3A2F]"
          />
          <label htmlFor="review-checkbox" className="text-xs text-[#424844] cursor-pointer">
            <span className="font-semibold text-[#07241A]"><UiText text={"I have reviewed the ingredients and cooking steps."} /></span>{" "}<UiText text={"Published recipes become available after you confirm ingredient provenance, resolve warnings, and verify step instructions."} /></label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm(ui("Bạn có chắc chắn muốn hủy các thay đổi?"))) {
                router.push("/");
              }
            }}
            className="text-xs font-semibold text-[#727974] hover:text-[#07241A] transition text-left sm:text-center"
          ><UiText text={"✕ Discard changes"} /></button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition disabled:opacity-50 cursor-pointer"
            ><UiText text={"Save draft"} /></button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting || !hasReviewed}
              className="flex items-center gap-2 rounded-xl bg-[#07241A] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>🚀</span>
              <span>{isSubmitting ? ui("Đang xuất bản...") : ui("Publish recipe")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
