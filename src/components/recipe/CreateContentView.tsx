"use client";

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
  { value: "PLANT", label: "Thực vật (Plant)", desc: "100% gốc thực vật" },
  { value: "DAIRY", label: "Sữa (Dairy)", desc: "Bơ, sữa chua, phô mai..." },
  { value: "EGG", label: "Trứng (Egg)", desc: "Trứng gà, vịt..." },
  { value: "HONEY", label: "Mật ong (Honey)", desc: "Mật ong tự nhiên" },
];

const subscribeHydration = () => () => {};

export default function CreateContentView() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const contentOwner = user?.uid || "guest";
  const isMounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const token = typeof window !== "undefined" ? getStoredToken() : null;
  const isLoggedIn = isMounted && (!!user || !!token);

  // Mode: "ai" vs "manual"
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");
  const [contentType, setContentType] = useState<"recipe" | "review">("recipe");

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

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredientPayload[]>([
    {
      ingredientName: "Đậu hũ non hữu cơ (Firm organic tofu)",
      amount: "400 g",
      dietaryGroup: "PLANT",
      allergenId: null,
    },
    {
      ingredientName: "Cà chua chín mọng (Ripe heirloom plum tomatoes)",
      amount: "4 quả",
      dietaryGroup: "PLANT",
      allergenId: null,
    },
    {
      ingredientName: "Hành baro băm nhỏ (Scallions)",
      amount: "2 nhánh",
      dietaryGroup: "PLANT",
      allergenId: null,
    },
  ]);

  // Cooking steps
  const [steps, setSteps] = useState<RecipeStepPayload[]>([
    {
      stepNumber: 1,
      instruction:
        "Cắt đậu hũ thành các miếng vuông vừa ăn. Áp chảo với lửa vừa cùng 1 thìa dầu ăn cho đến khi các mặt có màu vàng giòn nhẹ.",
    },
    {
      stepNumber: 2,
      instruction:
        "Phi thơm hành baro. Cho cà chua thái hạt lựu, chút muối và đường vào đun nhỏ lửa trong 5 phút đến khi nhuyễn thành sốt sánh mịn.",
    },
    {
      stepNumber: 3,
      instruction:
        "Cho đậu hũ đã áp chảo vào sốt cà chua, rim lửa nhỏ 3-4 phút cho ngấm vị. Rắc hành ngò lên trên và thưởng thức nóng cùng cơm trắng.",
    },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [publishedResult, setPublishedResult] = useState<RecipeResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

    setIsUploading(true);
    setStatusMessage({
      type: "info",
      text: "Đang tải video lên máy chủ... Vui lòng không đóng trang.",
    });

    try {
      const res = await uploadVideoRecipeDraft(videoFile);
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
      const msg = err instanceof Error ? err.message : "Tải lên video thất bại";
      setStatusMessage({ type: "error", text: msg });
    } finally {
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
          text: `Chúc mừng! Công thức "${published.title}" đã được xuất bản thành công (Mã bài viết: #${published.postId})!`,
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
          text: `Chúc mừng! Công thức "${res.title}" đã được xuất bản thành công (Mã bài viết: #${res.postId})!`,
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
              <span>EDITORIAL WORKBENCH</span>
            </span>
            <span className="text-xs text-[#727974]">
              · Draft auto-saved recently
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#07241A] sm:text-4xl">
            Create Content
          </h1>
          <p className="mt-1 text-sm text-[#424844]">
            Share a cherished plant-forward recipe or document your culinary discoveries across mindful tables.
          </p>
        </div>

        {/* Mode Toggle: Video & Recipe vs Restaurant Review */}
        <div className="flex items-center rounded-2xl bg-[#EFEEEB] p-1 shadow-inner self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setContentType("recipe")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              contentType === "recipe"
                ? "bg-[#07241A] text-white shadow-xs"
                : "text-[#424844] hover:text-[#07241A]"
            }`}
          >
            <span>🎬 📖</span>
            <span>Video &amp; Recipe</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContentType("review");
              setStatusMessage({
                type: "info",
                text: "Chức năng Restaurant Review đang được phát triển và sẽ sớm ra mắt!",
              });
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition opacity-70 ${
              contentType === "review"
                ? "bg-[#07241A] text-white"
                : "text-[#727974] hover:text-[#07241A]"
            }`}
          >
            <span>🍽️</span>
            <span>Restaurant Review (Sắp ra mắt)</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
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
              <span>{statusMessage.text}</span>
            </div>
            {publishedResult && (
              <Link
                href="/my-content"
                className="underline font-bold hover:text-black ml-4"
              >
                Xem bài viết
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Auth Warning if not logged in */}
      {isMounted && !isLoggedIn && (
        <div className="my-6 rounded-2xl bg-[#F5F3F0] p-4 text-xs text-[#07241A] border border-[#EFEEEB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Bạn đang xem ở chế độ khách. Vui lòng đăng nhập để lưu trữ bản nháp và xuất bản công thức lên hệ thống.</span>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A2F]"
          >
            Đăng nhập
          </Link>
        </div>
      )}

      {/* ── STEP 1: CHOOSE HOW TO CREATE ───────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
          <span className="text-xs font-bold tracking-wider text-[#727974] uppercase">
            STEP 1: CHOOSE HOW TO CREATE
          </span>
          <span className="text-xs text-[#727974]">Step 1 of 4</span>
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
                  <h3 className="font-serif text-lg font-bold text-[#07241A]">
                    Generate with AI
                  </h3>
                </div>
                <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#99462A]">
                  Recommended
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#424844]">
                Upload cooking footage or enter dish notes. AI creates an editable draft of ingredients and culinary steps for you to review.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <span>Tự động nhận diện nguyên liệu &amp; công thức</span>
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
                  <h3 className="font-serif text-lg font-bold text-[#07241A]">
                    Write Manually
                  </h3>
                </div>
                <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#727974]">
                  Standard
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#424844]">
                Enter ingredients, measurements, and cooking technique manually. Video attachment remains completely optional.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <span>Tự do điều chỉnh toàn bộ chi tiết</span>
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
              Recipe details
            </h2>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-[#99462A] uppercase">
            REQUIRED DETAILS
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {/* Recipe Title */}
          <div>
            <label className="block text-xs font-semibold text-[#07241A]">
              Recipe title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Easy Tofu in Tomato Sauce"
              className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 text-sm text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>

          {/* Category, Prep Minutes, Servings */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#07241A]">
                Heritage category <span className="text-red-500">*</span>
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
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preparation time */}
            <div>
              <label className="block text-xs font-semibold text-[#07241A]">
                Preparation cadence (phút)
              </label>
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
              <label className="block text-xs font-semibold text-[#07241A]">
                Servings (Khẩu phần)
                {creationMode === "ai" && (
                  <span className="ml-1 text-[10px] text-[#727974] font-normal">
                    (Manual only)
                  </span>
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
              <label className="block text-xs font-semibold text-[#07241A]">
                Story &amp; flavor profile (Mô tả món ăn)
              </label>
              <span className="text-[11px] text-[#727974]">
                {content.length} / 500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="A comforting home-cooked dish featuring pan-seared golden tofu braised in a fresh, savory tomato reduction..."
              className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-xs text-[#07241A] placeholder-[#727974] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* ── Section: Video or dish idea (AI mode) ───────────────────────── */}
      {creationMode === "ai" && (
        <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
          <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
                🎥
              </span>
              <h2 className="font-serif text-lg font-bold text-[#07241A]">
                Video or dish idea
              </h2>
            </div>
            <span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#1E3A2F]">
              AI POWERED EXTRACTION
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#07241A]">
                Option A: Upload cooking video
              </span>
              <span className="text-[#727974]">
                MP4, MOV, WEBM, AVI (Tối đa 100 MB)
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
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
                <p className="mt-3 text-xs font-semibold text-[#07241A]">
                  Bấm để chọn tệp video nấu ăn từ thiết bị
                </p>
                <p className="mt-1 text-[11px] text-[#727974]">
                  Hệ thống hỗ trợ MP4, MOV, WEBM hoặc AVI (dưới 100 MB)
                </p>
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
                        <span className="rounded-full bg-[#D9E6DC] px-2.5 py-0.5 text-[10px] font-bold text-[#07241A]">
                          ✓ READY (Đã phân tích)
                        </span>
                      ) : draftStatus === "PROCESSING" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse">
                          ⚙️ Đang phân tích...
                        </span>
                      ) : draftStatus === "PENDING" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                          ⏳ Chờ xử lý
                        </span>
                      ) : draftStatus === "FAILED" ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                          ✕ Lỗi xử lý
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[10px] font-bold text-[#727974]">
                          Chưa gửi phân tích
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
                          <span>Audio speech &amp; step analysis</span>
                          <span>Đang nhận diện giọng nói...</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEEEB]">
                          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1E3A2F]" />
                        </div>
                      </div>
                    )}

                    {draftErrorMessage && (
                      <p className="text-xs text-red-600 font-medium">
                        {draftErrorMessage}
                      </p>
                    )}

                    {/* Actions on video */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#424844] hover:bg-[#F5F3F0] transition"
                      >
                        Replace video
                      </button>
                      {draftStatus === "FAILED" && (
                        <button
                          type="button"
                          onClick={handleRetryDraft}
                          className="rounded-xl bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A2F] transition"
                        >
                          Retry analysis
                        </button>
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
                disabled={isUploading || !videoFile || draftStatus === "PROCESSING"}
                className="flex items-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>✨</span>
                <span>
                  {isUploading
                    ? "Đang tải video..."
                    : draftStatus === "PROCESSING"
                    ? "AI đang phân tích..."
                    : "Generate draft"}
                </span>
              </button>
              <span className="text-[11px] text-[#727974] italic">
                AI draft - review required before publishing
              </span>
            </div>
          </div>
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
              <h2 className="font-serif text-lg font-bold text-[#07241A]">
                Ingredients
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#727974]">
              Edit quantities, ingredient names, and verify pantry provenance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/40 transition self-start sm:self-auto cursor-pointer"
          >
            <span>+</span>
            <span>Add ingredient</span>
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
                      placeholder="e.g. 400g / 2 thìa"
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
                      placeholder="Tên nguyên liệu (e.g. Đậu hũ)"
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
                          {g.label}
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
                      <option value="">(Không dị ứng)</option>
                      {allergens.map((al) => (
                        <option key={al.id} value={al.id}>
                          {al.name}
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
                      title="Xóa nguyên liệu"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Non-plant clarification warning */}
                {isNonPlant && (
                  <div className="rounded-xl bg-[#FDE8E4] px-3 py-1.5 text-[11px] text-[#99462A] flex items-center justify-between">
                    <span>
                      ⚠️ Nhóm nguyên liệu <strong>{ing.dietaryGroup}</strong> sẽ ảnh hưởng đến độ tương thích Vegan thuần chay.
                    </span>
                    <span className="font-semibold text-[10px] uppercase">
                      Needs Clarification
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section: Diet compatibility ─────────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-white p-6 shadow-xs border border-[#EFEEEB]">
        <div className="border-b border-[#EFEEEB] pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CAEADA] text-xs">
                🌱
              </span>
              <h2 className="font-serif text-lg font-bold text-[#07241A]">
                Diet compatibility
              </h2>
            </div>
            <span className="text-[11px] text-[#727974] italic">
              Based on ingredients confirmed by author
            </span>
          </div>
          <p className="mt-1 text-xs text-[#727974]">
            Evaluates listed ingredients against vegetarian classifications. Helps mindful diners discover suitable options with confidence.
          </p>
        </div>

        {/* Diet badges cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dietTypes.map((dt) => {
            const compatible = isDietCompatible(dt, ingredients);
            return (
              <div
                key={dt.id}
                className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                  compatible
                    ? "border-[#CAEADA] bg-[#FBF9F6]"
                    : "border-[#EFEEEB] bg-white opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-[#07241A]">
                    {dt.name}
                  </span>
                  {compatible ? (
                    <span className="rounded-full bg-[#D9E6DC] px-2.5 py-0.5 text-[10px] font-bold text-[#07241A]">
                      ✓ Compatible
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#FDE8E4] px-2 py-0.5 text-[10px] font-bold text-[#99462A]">
                      Needs clarification
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-[#727974]">
                  {compatible ? (
                    <span>Tất cả nguyên liệu thuộc nhóm cho phép.</span>
                  ) : (
                    <span>Có nguyên liệu ngoài nhóm {dt.allowedIngredientGroups?.join(", ")}.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-[#F5F3F0] p-3 text-[11px] text-[#424844] flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            Kết quả cuối cùng sẽ được máy chủ tự động tính toán và lưu thành các danh mục tương thích (compatibleDietTypeIds) khi công thức được đăng tải.
          </span>
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
              <h2 className="font-serif text-lg font-bold text-[#07241A]">
                Cooking steps
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#727974]">
              Step-by-step guidance formatted with culinary precision.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-[#D9E6DC]/40 transition self-start sm:self-auto cursor-pointer"
          >
            <span>+</span>
            <span>Add step</span>
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#07241A]">
                    BƯỚC {st.stepNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="text-xs text-[#727974] hover:text-red-600 transition p-1"
                  title="Xóa bước này"
                >
                  ✕ Xóa
                </button>
              </div>
              <textarea
                rows={2}
                value={st.instruction}
                onChange={(e) => handleUpdateStep(index, e.target.value)}
                placeholder="Mô tả kỹ thuật nấu, lửa và thời gian cho bước này..."
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
            <span className="font-semibold text-[#07241A]">
              I have reviewed the ingredients and cooking steps.
            </span>{" "}
            Published recipes become available after you confirm ingredient provenance, resolve warnings, and verify step instructions.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn hủy các thay đổi?")) {
                router.push("/");
              }
            }}
            className="text-xs font-semibold text-[#727974] hover:text-[#07241A] transition text-left sm:text-center"
          >
            ✕ Discard changes
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition disabled:opacity-50 cursor-pointer"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting || !hasReviewed}
              className="flex items-center gap-2 rounded-xl bg-[#07241A] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>🚀</span>
              <span>{isSubmitting ? "Đang xuất bản..." : "Publish recipe"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
