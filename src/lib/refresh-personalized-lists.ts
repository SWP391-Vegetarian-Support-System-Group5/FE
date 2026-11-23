import { getPosts, getBookmarks } from "@/lib/post-api";
import { getMealPlans, MealPlanRequestError } from "@/lib/meal-plan-api";
import { getStoredToken } from "@/lib/auth";

/** A successful save and a failed refresh are different outcomes; never retry the write automatically. */
export async function refreshPersonalizedLists(session: string) {
  if (getStoredToken() !== session) throw new Error("ALLERGEN_SESSION_CHANGED");
  const results = await Promise.allSettled([
    getPosts({ sort: "rating" }), getBookmarks(), getMealPlans(),
  ]);
  if (getStoredToken() !== session) throw new Error("ALLERGEN_SESSION_CHANGED");
  return results.every(result => result.status === "fulfilled" ||
    (result.reason instanceof MealPlanRequestError && result.reason.status === 409));
}
