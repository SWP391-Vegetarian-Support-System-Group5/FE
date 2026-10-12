import type { RecipeResponse, RecipeIngredientPayload, RecipeStepPayload } from "@/lib/recipe-api";

export interface ManualRecipeDraft {
  title: string;
  content: string;
  categoryId: number | null;
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  ingredients: RecipeIngredientPayload[];
  steps: RecipeStepPayload[];
  selectedTagIds: number[];
  savedAt: string;
}

export interface MyContentItem {
  id: string;
  title: string;
  description: string;
  kind: "recipe" | "video";
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  image?: string;
  minutes?: number;
  recipe?: RecipeResponse;
  draft?: ManualRecipeDraft;
  translations?: { title: string; description: string };
}

export const MY_CONTENT_EVENT = "veggiemate-content-change";
const keyFor = (owner: string) => `veggiemate-my-content:${encodeURIComponent(owner)}`;

// A browser collection of successful publish responses and locally saved drafts.
// This is not a substitute for a server-side user-content listing endpoint.
export function getMyContentSnapshot(owner: string): string {
  try { return localStorage.getItem(keyFor(owner)) || "[]"; } catch { return "[]"; }
}

export function parseMyContent(snapshot: string): MyContentItem[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is MyContentItem =>
      item && typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.description === "string" && typeof item.createdAt === "string" &&
      typeof item.updatedAt === "string" &&
      (item.kind === "recipe" || item.kind === "video") &&
      (item.status === "published" || item.status === "draft"),
    );
  } catch { return []; }
}

export function readMyContent(owner: string): MyContentItem[] {
  return parseMyContent(getMyContentSnapshot(owner));
}

export function saveContentItem(owner: string, item: MyContentItem) {
  const items = readMyContent(owner);
  const previous = items.find((entry) => entry.id === item.id);
  localStorage.setItem(keyFor(owner), JSON.stringify([
    { ...item, createdAt: previous?.createdAt || item.createdAt },
    ...items.filter((entry) => entry.id !== item.id),
  ]));
  window.dispatchEvent(new Event(MY_CONTENT_EVENT));
}

export function saveManualContent(owner: string, draft: ManualRecipeDraft) {
  saveContentItem(owner, {
    id: "manual-draft", title: draft.title, description: draft.content,
    kind: "recipe", status: "draft", createdAt: draft.savedAt, updatedAt: draft.savedAt,
    minutes: (Number(draft.prepMinutes) || 0) + (Number(draft.cookMinutes) || 0), draft,
  });
}

export function removeManualContent(owner: string) {
  // Published posts are deliberately not deleted here: there is no delete API yet.
  const items = readMyContent(owner);
  const draft = items.find((entry) => entry.id === "manual-draft")?.draft;
  localStorage.setItem(keyFor(owner), JSON.stringify(items.filter((entry) => entry.id !== "manual-draft")));
  // Clear the older editor key only if it is a copy of this exact draft.
  try {
    const legacy = JSON.parse(localStorage.getItem("veggie_manual_recipe_draft") || "null");
    if (draft && legacy?.savedAt === draft.savedAt && legacy?.title === draft.title) {
      localStorage.removeItem("veggie_manual_recipe_draft");
    }
  } catch { /* A malformed legacy draft does not affect the collection. */ }
  window.dispatchEvent(new Event(MY_CONTENT_EVENT));
}

export function rememberPublishedContent(owner: string, recipe: RecipeResponse, kind: MyContentItem["kind"]) {
  const now = new Date().toISOString();
  saveContentItem(owner, {
    id: `recipe-${recipe.postId}`, title: recipe.title, description: recipe.content,
    kind, status: "published", createdAt: now, updatedAt: now,
    minutes: (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0), recipe,
  });
}

export const sampleContent: MyContentItem[] = [
  { id: "sample-1", title: "Easy Tofu in Tomato Sauce", description: "Golden, pan-seared tofu in a rich tomato sauce. A little comfort for your everyday table.", translations: { title: "Đậu hũ sốt cà chua", description: "Đậu hũ vàng giòn trong sốt cà chua đậm đà. Một chút ấm áp cho bữa cơm mỗi ngày." }, kind: "video", status: "published", image: "/images/recipe_tofu_tomato.png", minutes: 35, createdAt: "2026-10-09T08:00:00Z", updatedAt: "2026-10-09T08:00:00Z" },
  { id: "sample-2", title: "Fresh Vietnamese Spring Rolls", description: "Crisp greens, fragrant herbs and a creamy peanut dip. Freshness wrapped in every bite.", translations: { title: "Gỏi cuốn chay thanh mát", description: "Rau xanh, thảo mộc thơm và sốt đậu phộng béo bùi. Tươi mát trong từng cuốn nhỏ." }, kind: "recipe", status: "published", image: "/images/my-content-fresh-rolls.jpg", minutes: 25, createdAt: "2026-10-07T08:00:00Z", updatedAt: "2026-10-07T08:00:00Z" },
  { id: "sample-3", title: "A Cozy Bowl of Vegan Bún Huế", description: "A warming lemongrass broth with mushrooms and tofu, inspired by the flavors of central Vietnam.", translations: { title: "Bún Huế chay đậm vị", description: "Nước dùng sả ấm nồng cùng nấm và đậu hũ, lấy cảm hứng từ hương vị miền Trung." }, kind: "video", status: "draft", image: "/images/my-content-noodles.jpg", minutes: 50, createdAt: "2026-10-05T08:00:00Z", updatedAt: "2026-10-08T08:00:00Z" },
  { id: "sample-4", title: "Claypot Tofu & Garden Mushrooms", description: "Slow-braised tofu with earthy mushrooms and cracked pepper. Best shared over a pot of rice.", translations: { title: "Đậu hũ kho nấm trong niêu", description: "Đậu hũ kho chậm cùng nấm và tiêu thơm. Ngon nhất khi dùng với cơm nóng." }, kind: "recipe", status: "published", image: "/images/recipe_claypot_tofu.png", minutes: 40, createdAt: "2026-10-03T08:00:00Z", updatedAt: "2026-10-03T08:00:00Z" },
  { id: "sample-5", title: "Spring Rolls, Step by Step", description: "My favorite way to roll a colorful, plant-filled lunch. A simple kitchen ritual worth sharing.", translations: { title: "Từng bước làm gỏi cuốn", description: "Cách làm bữa trưa rực rỡ sắc màu từ thực vật. Một thói quen nhỏ đáng chia sẻ." }, kind: "video", status: "published", image: "/images/my-content-fresh-rolls.jpg", minutes: 20, createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z" },
  { id: "sample-6", title: "The Weeknight Tofu Diaries", description: "Notes from my kitchen: making a comforting, wholesome dinner with a handful of pantry ingredients.", translations: { title: "Nhật ký bữa tối với đậu hũ", description: "Ghi chép từ căn bếp: bữa tối ấm áp, lành mạnh với những nguyên liệu quen thuộc." }, kind: "recipe", status: "draft", image: "/images/recipe_tofu_tomato.png", minutes: 30, createdAt: "2026-09-28T08:00:00Z", updatedAt: "2026-10-02T08:00:00Z" },
  { id: "sample-7", title: "Sunday Mushroom Claypot", description: "A slow Sunday recipe with a deeply savory sauce, fresh herbs and plenty of time to savor.", translations: { title: "Niêu nấm cho ngày Chủ nhật", description: "Món ngon cuối tuần với sốt đậm đà, rau thơm và thời gian để thưởng thức thật chậm." }, kind: "recipe", status: "published", image: "/images/recipe_claypot_tofu.png", minutes: 45, createdAt: "2026-09-25T08:00:00Z", updatedAt: "2026-09-25T08:00:00Z" },
];
