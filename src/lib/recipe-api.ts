import { apiFetch, apiGet } from "@/lib/api";

export type DietaryGroup = "PLANT" | "DAIRY" | "EGG" | "HONEY";

export interface CategoryItem {
  id: number;
  name: string;
  type: string | null;
}

export interface AllergenItem {
  id: number;
  name: string;
  type: string | null;
}

export interface TagItem {
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
}

export interface RecipeStepPayload {
  stepNumber: number;
  instruction: string;
}

export interface CreateRecipePayload {
  title: string;
  content: string;
  categoryId: number | null;
  videoUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  tagIds: number[];
}

export interface RecipeResponse {
  postId: number;
  title: string;
  content: string;
  status: "PUBLISHED" | string;
  servings: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  compatibleDietTypeIds: number[];
  categoryId?: number | null;
  videoUrl?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  tagIds?: number[];
}

export type VideoDraftStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "PUBLISHED";

export interface VideoRecipeDraftResponse {
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
  title: string;
  description: string;
  transcript: string | null;
  estimatedPrepMinutes: number | null;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
}

export interface PublishVideoRecipeDraftPayload {
  categoryId: number | null;
  tagIds: number[];
}

// ── Master data endpoints ──────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await apiGet<CategoryItem[]>("/api/categories");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getAllergens(): Promise<AllergenItem[]> {
  try {
    const res = await apiGet<AllergenItem[]>("/api/allergens");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getTags(): Promise<TagItem[]> {
  try {
    const res = await apiGet<TagItem[]>("/api/tags");
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

export async function getRecipeById(id: number): Promise<RecipeResponse> {
  return await apiGet<RecipeResponse>(`/api/recipes/${id}`);
}

// ── AI Video Recipe Drafts ─────────────────────────────────────────────────

export async function uploadVideoRecipeDraft(videoFile: File): Promise<VideoRecipeDraftResponse> {
  const formData = new FormData();
  formData.append("video", videoFile);

  const res = await apiFetch("/api/video-recipe-drafts", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `Không thể tải lên video (${res.status})`;
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

export async function getVideoRecipeDraft(id: number): Promise<VideoRecipeDraftResponse> {
  const res = await apiFetch(`/api/video-recipe-drafts/${id}`, {
    method: "GET",
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
