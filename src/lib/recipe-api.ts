import { apiFetch, apiGet, apiUpload, type UploadOptions } from "@/lib/api";

export type DietaryGroup = "PLANT" | "DAIRY" | "EGG" | "HONEY";

export interface IngredientCategoryItem {
  id: number;
  name: string;
  code: string;
  dietaryGroup: DietaryGroup | "UNVERIFIED";
}

export interface IngredientItem {
  id: number;
  name: string;
  ingredientCategoryId: number;
  dietaryGroup: DietaryGroup | "UNVERIFIED";
  allergenId: number | null;
}

export interface AllergenItem {
  id: number;
  name: string;
  type: string | null;
}


export interface DietTypeItem {
  id: number;
  name: string;
  allowedIngredientGroups: string[];
  prohibitedIngredientGroups: string[];
}

export interface RecipeIngredientPayload {
  ingredientName: string;
  amount: string | null;
  dietaryGroup: DietaryGroup;
  allergenId: number | null;
  ingredientCategoryId?: number | null;
}

export interface RecipeStepPayload {
  stepNumber: number;
  instruction: string;
}

export interface CreateRecipePayload {
  bmiTypeIds?: number[];
  title: string;
  recipeName: string;
  content: string;
  videoUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  categoryIds: number[];
}

export interface RecipeResponse {
  moderationReason?: string | null;
  bmiTypes?: import("@/lib/bmi-api").BmiType[];
  postId: number;
  title: string;
  recipeName: string;
  content: string;
  status: "PUBLISHED" | string;
  servings: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  compatibleDietTypeIds: number[];
  categories: import("@/lib/recipe-categories").RecipeCategory[];
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  categoryIds?: number[];
}

export type VideoDraftStatus =
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "PUBLISHED";

export interface VideoRecipeDraftResponse {
  recipePostId?: number | null;
  recipeName: string | null;
  videoRecipeDraftId: number;
  status: VideoDraftStatus;
  videoUrl: string;
  title: string | null;
  description: string | null;
  transcript: string | null;
  estimatedPrepMinutes: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVideoRecipeDraftPayload {
  recipeName: string;
  title: string;
  description: string;
  transcript: string | null;
  estimatedPrepMinutes: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
}

export interface PublishVideoRecipeDraftPayload {
  bmiTypeIds?: number[];
  recipeName: string;
  categoryIds: number[];
}

// ── Master data endpoints ──────────────────────────────────────────────────

export function getIngredientCategories(): Promise<IngredientCategoryItem[]> {
  return apiGet<IngredientCategoryItem[]>("/api/ingredient-categories");
}

export async function saveIngredientCategory(payload: Pick<IngredientCategoryItem, "code" | "name" | "dietaryGroup">, id?: number): Promise<IngredientCategoryItem> {
  const response = await apiFetch(`/api/admin/ingredient-categories${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST", body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || `Ingredient category save failed (${response.status})`);
  }
  return response.json();
}

export function getIngredients(keyword?: string): Promise<IngredientItem[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return apiGet<IngredientItem[]>(`/api/ingredients${query}`);
}

export async function updateIngredient(id: number, payload: { name: string; ingredientCategoryId: number; allergenId: number | null }): Promise<IngredientItem> {
  const response = await apiFetch(`/api/admin/ingredients/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || `Ingredient update failed (${response.status})`);
  }
  return response.json();
}

export async function getAllergens(): Promise<AllergenItem[]> {
  try {
    const res = await apiGet<AllergenItem[]>("/api/allergens");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getDietTypes(): Promise<DietTypeItem[]> {
  try {
    const res = await apiGet<DietTypeItem[]>("/api/diet-types");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

// ── Recipe manual publishing ───────────────────────────────────────────────

export async function createRecipe(payload: CreateRecipePayload): Promise<RecipeResponse> {
  const res = await apiFetch("/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Đăng công thức thất bại (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as RecipeResponse;
}

export async function updateRecipe(id: number, payload: CreateRecipePayload): Promise<RecipeResponse> {
  const response = await apiFetch(`/api/recipes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || `Không lưu được công thức (${response.status}).`);
  }
  return getRecipeById(id);
}

export async function getRecipeById(id: number): Promise<RecipeResponse> {
  return await apiGet<RecipeResponse>(`/api/recipes/${id}`);
}

// ── AI Video Recipe Drafts ─────────────────────────────────────────────────

export async function uploadVideoRecipeDraft(videoFile: File, options: UploadOptions = {}): Promise<VideoRecipeDraftResponse> {
  const formData = new FormData();
  formData.append("video", videoFile);

  const res = await apiUpload("/api/video-recipe-drafts", formData, options);

  if (!res.ok) {
    let errMsg = `Không thể tải lên video (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
      if (process.env.NODE_ENV === "development" && Array.isArray(errData.errors)) {
        const details = errData.errors.filter((error: unknown): error is string => typeof error === "string" && error.trim().length > 0);
        if (details.length > 0) errMsg += `\n${details.join("\n")}`;
      }
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as VideoRecipeDraftResponse;
}

export async function getVideoRecipeDraft(id: number): Promise<VideoRecipeDraftResponse> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}`, {
    method: "GET",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    let errMsg = `Không thể lấy bản nháp video (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as VideoRecipeDraftResponse;
}

export async function getMyVideoRecipeDrafts(): Promise<VideoRecipeDraftResponse[]> {
  const res = await apiFetch("/api/video-recipe-drafts", { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Không thể tải bản nháp video (${res.status})`);
  return (await res.json()) as VideoRecipeDraftResponse[];
}

export async function updateVideoRecipeDraft(
  id: number,
  payload: UpdateVideoRecipeDraftPayload
): Promise<VideoRecipeDraftResponse> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Không thể lưu bản nháp (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as VideoRecipeDraftResponse;
}

export async function publishVideoRecipeDraft(
  id: number,
  payload: PublishVideoRecipeDraftPayload
): Promise<RecipeResponse> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}/publish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Không thể đăng công thức từ bản nháp (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as RecipeResponse;
}

export async function retryVideoRecipeDraft(id: number): Promise<VideoRecipeDraftResponse> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}/retry`, {
    method: "POST",
  });

  if (!res.ok) {
    let errMsg = `Không thể thử lại phân tích (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as VideoRecipeDraftResponse;
}

export async function deleteVideoRecipeDraft(id: number): Promise<void> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Xóa bản nháp thất bại (${res.status})`);
  }
}

// ── Diet Compatibility evaluation ──────────────────────────────────────────

export function isDietCompatible(
  dietType: DietTypeItem,
  ingredients: RecipeIngredientPayload[]
): boolean {
  if (!ingredients || ingredients.length === 0) return false;
  const allowed = dietType.allowedIngredientGroups || [];
  return ingredients.every(
    (ing) => ing.dietaryGroup && allowed.includes(ing.dietaryGroup)
  );
}
