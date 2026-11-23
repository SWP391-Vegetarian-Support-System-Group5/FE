type RatedPost = {
  postId: number;
  averageRating: number;
  ratingCount: number;
  updatedAt?: string;
  createdAt?: string;
};

const count = (post: RatedPost) => Number.isFinite(post.ratingCount) && post.ratingCount > 0 ? Math.floor(post.ratingCount) : 0;
const score = (post: RatedPost) => count(post) > 0 && Number.isFinite(post.averageRating) ? Math.max(0, Math.min(5, post.averageRating)) : 0;
const updated = (post: RatedPost) => {
  const time = Date.parse(post.updatedAt || post.createdAt || "");
  return Number.isFinite(time) ? time : 0;
};

/** Apply after eligibility filters and before slicing; never mutate API/state arrays. */
export function comparePostRatings(a: RatedPost, b: RatedPost): number {
  return score(b) - score(a)
    || count(b) - count(a)
    || updated(b) - updated(a)
    || b.postId - a.postId;
}

export function rankPostsByRating<T extends RatedPost>(posts: readonly T[]): T[] {
  return [...posts].sort(comparePostRatings);
}
