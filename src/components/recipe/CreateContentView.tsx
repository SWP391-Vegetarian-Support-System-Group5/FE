"use client";

import UiText, { useUiText } from "@/components/UiText";
import UploadProgress from "@/components/ui/UploadProgress";
import { useLanguage } from "@/context/LanguageContext";

import RecipeCategoryPicker from "./RecipeCategoryPicker";
import BmiTypePicker from "./BmiTypePicker";
import { getRecipeCategories, type RecipeCategory } from "@/lib/recipe-categories";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { localizeText } from "@/lib/localized-content";
import { getStoredToken } from "@/lib/auth";
import { getMediaUrl } from "@/lib/api";
import { readMyContent, saveManualContent, removeManualContent, rememberPublishedContent } from "@/lib/my-content";
import {
  IngredientCategoryItem,
  IngredientItem,
  AllergenItem,
  DietaryGroup,
  RecipeIngredientPayload,
  RecipeStepPayload,
  RecipeResponse,
  VideoDraftStatus,
  VideoRecipeDraftResponse,
  getIngredientCategories,
  getIngredients,
  getAllergens,
  createRecipe,
  uploadVideoRecipeDraft,
  getVideoRecipeDraft,
  updateVideoRecipeDraft,
  publishVideoRecipeDraft,
  retryVideoRecipeDraft,
} from "@/lib/recipe-api";

const INGREDIENT_CATEGORY_LABELS: Record<string, [string, string]> = {
  PLANT: ["Plant", "Thực vật"], DAIRY: ["Dairy", "Sữa và chế phẩm từ sữa"],
  EGG: ["Egg", "Trứng"], HONEY: ["Honey", "Mật ong"],
};

const subscribeHydration = () => () => {};
const DRAFT_POLL_INTERVAL_MS = 4_000;
const isMissingVideoSource = (message: string | null) =>
  (message?.includes("The original video file is no longer available") ||
    message?.includes("The original video is no longer on the server") ||
    message?.includes("Video gốc không còn trên máy chủ")) ?? false;

export default function CreateContentView() {
  return <RecipeContentView />;
}

function RecipeContentView() {
  const ui = useUiText();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const contentOwner = user?.uid || "guest";
  const isMounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const token = typeof window !== "undefined" ? getStoredToken() : null;
  const isLoggedIn = isMounted && (!!user || !!token);

  // Mode: "ai" vs "manual"
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");

  const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>([]);

  // Master data
  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategoryItem[]>([]);
  const [ingredientCatalog, setIngredientCatalog] = useState<IngredientItem[]>([]);
  const [allergens, setAllergens] = useState<AllergenItem[]>([]);
  const [, setIsLoadingMasterData] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [prepMinutes, setPrepMinutes] = useState<string>("20");
  const [cookMinutes, setCookMinutes] = useState<string>("15");
  const [servings, setServings] = useState<string>("2");
  const [content, setContent] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedBmiTypeIds, setSelectedBmiTypeIds] = useState<number[]>([]);
  const isAdmin = user?.role === "ADMIN";

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
  const [restoringVideoDraft, setRestoringVideoDraft] = useState(false);
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
      setRecipeName(draft.recipeName || "");
      setContent(draft.content);
      setPrepMinutes(draft.prepMinutes);
      setCookMinutes(draft.cookMinutes);
      setServings(draft.servings);
      setIngredients(draft.ingredients);
      setSteps(draft.steps);
      setSelectedCategoryIds(draft.selectedCategoryIds || []);
      setSelectedBmiTypeIds(draft.selectedBmiTypeIds || []);
    });
    return () => { cancelled = true; };
  }, [authLoading, contentOwner]);

  // Load master data on mount
  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let cancelled = false;
    async function fetchMaster() {
      setIsLoadingMasterData(true);
      try {
        const [ingredientCategoryData, allData, recipeCategoryData, ingredientData] = await Promise.all([
          getIngredientCategories(),
          getAllergens(),
          getRecipeCategories(),
          getIngredients(),
        ]);
        if (cancelled) return;
        setIngredientCategories(ingredientCategoryData.filter(c => ["PLANT", "DAIRY", "EGG", "HONEY"].includes(c.code)));
        setIngredientCatalog(ingredientData.filter(x => x.dietaryGroup !== "UNVERIFIED"));
        setAllergens(allData);
        setRecipeCategories(recipeCategoryData);

      } catch {
        if (!cancelled) setStatusMessage({ type: "error", text: t("Could not load ingredient categories. Please try again.", "Không tải được danh mục nguyên liệu. Vui lòng thử lại.") });
      } finally {
        if (!cancelled) setIsLoadingMasterData(false);
      }
    }
    fetchMaster();
    return () => { cancelled = true; };
  }, [authLoading, user?.uid, t]);

  const pollInFlightRef = useRef(false);
  // Poll draft status
  const pollDraft = useCallback(
    async (id: number) => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const res: VideoRecipeDraftResponse = await getVideoRecipeDraft(id);
        setDraftStatus(res.status);
        setDraftErrorMessage(res.errorMessage || null);

        if (res.videoUrl && !videoPreviewUrl) {
          setVideoPreviewUrl(getMediaUrl(res.videoUrl));
        }

        if (res.status === "READY" || (res.status === "UPLOADING" && !!res.title)) {
          if (res.status === "READY" && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          if (res.title) setTitle(res.title);
          if (res.recipeName) setRecipeName(res.recipeName);
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

        } else if (res.status === "FAILED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setDraftErrorMessage(isMissingVideoSource(res.errorMessage)
            ? t("The original video is no longer on the server. Upload it again to create a new draft.", "Video gốc không còn trên máy chủ. Hãy tải lại video để tạo bản nháp mới.")
            : localizeText(res.errorMessage || t("Video processing failed. Try again.", "Xử lý video thất bại. Hãy thử lại."), language));
        } else if (res.status === "PUBLISHED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (error: unknown) {
        setDraftErrorMessage(error instanceof Error ? localizeText(error.message, language) : t("Could not refresh video status. Retrying...", "Chưa tải được trạng thái video. Đang thử lại..."));
      } finally {
        pollInFlightRef.current = false;
      }
    },
    [videoPreviewUrl, language, t]
  );
  const pollDraftRef = useRef(pollDraft);
  useEffect(() => { pollDraftRef.current = pollDraft; }, [pollDraft]);

  useEffect(() => {
    if (authLoading || restoredDraftRef.current) return;
    const match = /^video-(\d+)$/.exec(new URLSearchParams(window.location.search).get("draft") || "");
    if (!match) return;
    const id = Number(match[1]);
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setRestoringVideoDraft(true); });
    getVideoRecipeDraft(id).then((draft) => {
      if (cancelled) return;
      restoredDraftRef.current = true;
      setRestoringVideoDraft(false);
      setCreationMode("ai");
      setDraftId(id);
      setDraftStatus(draft.status);
      setDraftErrorMessage(isMissingVideoSource(draft.errorMessage)
        ? t("The original video is no longer on the server. Upload it again to create a new draft.", "Video gốc không còn trên máy chủ. Hãy tải lại video để tạo bản nháp mới.")
        : draft.errorMessage);
      setVideoPreviewUrl(draft.videoUrl ? getMediaUrl(draft.videoUrl) : null);
      setTitle(draft.title || "");
      setRecipeName(draft.recipeName || "");
      setContent(draft.description || "");
      setTranscript(draft.transcript);
      if (draft.estimatedPrepMinutes != null) setPrepMinutes(String(draft.estimatedPrepMinutes));
      if (draft.ingredients.length) setIngredients(draft.ingredients);
      if (draft.steps.length) setSteps(draft.steps.map((step, index) => ({ stepNumber: index + 1, instruction: step.instruction })));
      if (["PENDING", "UPLOADING", "PROCESSING"].includes(draft.status)) {
        pollIntervalRef.current = setInterval(() => { void pollDraftRef.current(id); }, DRAFT_POLL_INTERVAL_MS);
      }
    }).catch((error: unknown) => {
      if (!cancelled) {
        setRestoringVideoDraft(false);
        setStatusMessage({ type: "error", text: error instanceof Error ? error.message : "Không mở được bản nháp video." });
      }
    });
    return () => { cancelled = true; if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [authLoading, t]);

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
    setStatusMessage(null);
    setDraftId(null);
    setDraftStatus(null);
    setDraftErrorMessage(null);

    try {
      const res = await uploadVideoRecipeDraft(videoFile, { onProgress: setUploadPercent, signal: controller.signal });
      setDraftId(res.videoRecipeDraftId);
      setDraftStatus(res.status);

      // The worker may finish before the first interval tick.
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      void pollDraft(res.videoRecipeDraftId);
      pollIntervalRef.current = setInterval(() => {
        void pollDraftRef.current(res.videoRecipeDraftId);
      }, DRAFT_POLL_INTERVAL_MS);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatusMessage({ type: "info", text: "Upload cancelled." });
        return;
      }
      const msg = err instanceof Error ? err.message : "Tải lên video thất bại";
      setDraftStatus("FAILED");
      setDraftErrorMessage(localizeText(msg, language));
    } finally {
      uploadAbort.current = null;
      setIsUploading(false);
    }
  };

  // Retry failed draft
  const handleRetryDraft = async () => {
    if (!draftId) return;
    if (isMissingVideoSource(draftErrorMessage)) {
      if (videoFile) await handleGenerateDraft();
      else fileInputRef.current?.click();
      return;
    }
    try {
      setStatusMessage(null);
      setDraftStatus("PENDING");
      const res = await retryVideoRecipeDraft(draftId);
      setDraftStatus(res.status);
      setDraftErrorMessage(null);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      void pollDraft(draftId);
      pollIntervalRef.current = setInterval(() => {
        void pollDraftRef.current(draftId);
      }, DRAFT_POLL_INTERVAL_MS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thử lại thất bại";
      setDraftStatus("FAILED");
      setDraftErrorMessage(isMissingVideoSource(msg)
        ? t("The original video is no longer on the server. Upload it again to create a new draft.", "Video gốc không còn trên máy chủ. Hãy tải lại video để tạo bản nháp mới.")
        : localizeText(msg, language));
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
    const known = field === "ingredientName" ? ingredientCatalog.find(x => x.name.toLocaleLowerCase() === String(value).trim().toLocaleLowerCase() && x.dietaryGroup !== "UNVERIFIED") : undefined;
    setIngredients((prev) => prev.map((item, i) => i === index
      ? { ...item, [field]: value, ...(known && known.dietaryGroup !== "UNVERIFIED" ? { dietaryGroup: known.dietaryGroup, allergenId: known.allergenId } : {}) }
      : item));
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
          recipeName: recipeName.trim(),
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
        recipeName,
        content,
        prepMinutes,
        cookMinutes,
        servings,
        ingredients,
        steps,
        selectedCategoryIds,
        selectedBmiTypeIds,
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

    if (!title.trim() || !recipeName.trim()) {
      setStatusMessage({
        type: "error",
        text: t("Enter both the post title and dish name.", "Vui lòng nhập cả tiêu đề bài viết và tên món ăn."),
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
          recipeName: recipeName.trim(),
          description: content.trim(),
          transcript: transcript,
          estimatedPrepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : null,
          ingredients,
          steps,
        });

        // Step 2: Publish via POST /api/video-recipe-drafts/{id}/publish
        const published = await publishVideoRecipeDraft(draftId, {
          ...(isAdmin ? { bmiTypeIds: selectedBmiTypeIds } : {}),
          recipeName: recipeName.trim(),
          categoryIds: selectedCategoryIds,
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
          ...(isAdmin ? { bmiTypeIds: selectedBmiTypeIds } : {}),
          title: title.trim(),
          recipeName: recipeName.trim(),
          content: content.trim(),
          videoUrl: videoPreviewUrl || null,
          prepMinutes: prepMinutes ? parseInt(prepMinutes, 10) : null,
          cookMinutes: cookMinutes ? parseInt(cookMinutes, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
          ingredients,
          steps,
          categoryIds: selectedCategoryIds,
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
            {statusMessage.type === "success" && (
              <Link
                href="/my-content"
                className="underline font-bold hover:text-black ml-4"
              ><UiText text={publishedResult ? "Xem bài viết" : "Xem bản nháp"} /></Link>
            )}
          </div>
        </div>
      )}

      {restoringVideoDraft && <p role="status" className="my-4 text-sm text-[#647068]">{t("Loading saved draft...", "Đang tải bản nháp đã lưu...")}</p>}

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
            <h2 className="font-serif text-lg font-bold text-[#07241A]">
              {t("Recipe details", "Chi tiết công thức")}
            </h2>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-[#99462A] uppercase"><UiText text={"REQUIRED DETAILS"} /></span>
        </div>

        <div className="mt-6 space-y-5">
          {/* Recipe Title */}
          <div>
            <label className="block text-xs font-semibold text-[#07241A]">
              {t("Post title", "Tiêu đề bài viết")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={250}
              placeholder={t("e.g. My favorite weeknight recipe", "Ví dụ: Công thức bữa tối yêu thích của tôi")}
              className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 text-sm text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>

          {/* Category, Prep Minutes, Servings */}
          <label className="block text-xs font-semibold text-[#07241A]">
            {t("Recipe name", "Tên món ăn")} <span className="text-red-500">*</span>
            <input type="text" required maxLength={250} value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder={t("e.g. Tofu in tomato sauce", "Ví dụ: Đậu hũ sốt cà chua")} className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 text-sm font-normal text-[#07241A] outline-none focus:border-[#1E3A2F]" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

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
            {creationMode === "manual" && <div>
              <label className="block text-xs font-semibold text-[#07241A]">
                {t("Servings", "Khẩu phần")}
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
            </div>}
          </div>

          <RecipeCategoryPicker categories={recipeCategories} selected={selectedCategoryIds} onChange={setSelectedCategoryIds} />
          {isAdmin && <div className="mt-5"><BmiTypePicker selected={selectedBmiTypeIds} onChange={setSelectedBmiTypeIds} disabled={isSubmitting} /></div>}

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
                    <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
                      <span className="text-xs font-bold text-[#07241A] truncate max-w-xs">
                        {videoFile?.name || "Uploaded video"}
                      </span>
                      {isUploading || draftStatus === "UPLOADING" ? (
                        <span role="status" className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse">{t("Uploading video...", "Đang tải video...")}</span>
                      ) : draftStatus === "READY" ? (
                        <span className="rounded-full bg-[#D9E6DC] px-2.5 py-0.5 text-[10px] font-bold text-[#07241A]">
                          {t("Analysis complete", "Đã phân tích")}
                        </span>
                      ) : draftStatus === "PROCESSING" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse">
                          {t("Analyzing...", "Đang phân tích...")}
                        </span>
                      ) : draftStatus === "PENDING" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                          {t("Waiting for analysis", "Chờ phân tích")}
                        </span>
                      ) : draftStatus === "FAILED" ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                          {t("Processing failed", "Xử lý thất bại")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#727974]">
                          {t("Not submitted", "Chưa gửi phân tích")}
                        </span>
                      )}
                    </div>

                    {videoFile && (
                      <p className="text-[11px] text-[#727974]">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
                        {videoFile.type || "video"}
                      </p>
                    )}

                    {/* Status descriptions */}
                    {draftStatus === "PROCESSING" && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-[#727974]">
                          <span>{t("Speech and cooking step analysis", "Phân tích lời nói và bước nấu")}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEEEB]">
                          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1E3A2F]" />
                        </div>
                      </div>
                    )}

                    {draftErrorMessage && (
                      <p role="alert" className="whitespace-pre-wrap break-words text-xs text-red-600 font-medium">
                        {draftErrorMessage}
                      </p>
                    )}

                    {/* Actions on video */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || draftStatus === "UPLOADING" || draftStatus === "PENDING" || draftStatus === "PROCESSING"}
                        className="rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#424844] hover:bg-[#F5F3F0] transition"
                      >
                        {t("Replace video", "Đổi video")}
                      </button>
                      {draftStatus === "FAILED" && draftId && (
                        <button
                          type="button"
                          onClick={handleRetryDraft}
                          className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A2F] transition"
                        >
                          {isMissingVideoSource(draftErrorMessage)
                            ? t("Upload video again", "Tải lại video")
                            : t("Retry analysis", "Thử phân tích lại")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generate draft button */}
            <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isUploading || !videoFile || draftStatus === "UPLOADING" || draftStatus === "PENDING" || draftStatus === "PROCESSING"}
                className="flex items-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>✨</span>
                <span>
                  {isUploading || draftStatus === "UPLOADING"
                    ? t("Uploading video...", "Đang tải video...")
                    : draftStatus === "PROCESSING"
                    ? t("Analyzing...", "Đang phân tích...")
                    : draftStatus === "PENDING"
                    ? t("Waiting for analysis", "Chờ phân tích")
                    : t("Generate draft", "Tạo bản nháp")}
                </span>
              </button>
              <span className="text-[11px] text-[#727974] italic">
                {t("Review the draft before publishing", "Kiểm tra bản nháp trước khi đăng")}
              </span>
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
        <datalist id="ingredient-catalog">
          {ingredientCatalog.map(x => <option key={x.id} value={x.name} />)}
        </datalist>
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
                      list="ingredient-catalog"
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
                      {ingredientCategories.map((g) => (
                        <option key={g.id} value={g.code}>
                          {INGREDIENT_CATEGORY_LABELS[g.code] ? t(...INGREDIENT_CATEGORY_LABELS[g.code]) : g.name}
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
                    <span><UiText text={"⚠️ Nhóm nguyên liệu"} />{" "}<strong>{t(...INGREDIENT_CATEGORY_LABELS[ing.dietaryGroup])}</strong>{" "}<UiText text={"affects vegan diet compatibility."} /></span>
                    <span className="font-semibold text-[10px] uppercase"><UiText text={"Needs Clarification"} /></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


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
