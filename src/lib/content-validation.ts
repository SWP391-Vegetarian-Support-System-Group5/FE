export type PostField = "title" | "content" | "videoUrl";
export type PostFieldError = "titleRequired" | "titleTooLong" | "contentRequired" | "invalidVideoUrl";

export function validatePostFields(fields: { title: string; content: string; videoUrl: string; includeVideo: boolean }): Partial<Record<PostField, PostFieldError>> {
  const errors: Partial<Record<PostField, PostFieldError>> = {};
  if (!fields.title.trim()) errors.title = "titleRequired";
  else if (fields.title.trim().length > 250) errors.title = "titleTooLong";
  if (!fields.content.trim()) errors.content = "contentRequired";
  if (fields.includeVideo && fields.videoUrl.trim()) {
    try {
      const url = new URL(fields.videoUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) errors.videoUrl = "invalidVideoUrl";
    } catch { errors.videoUrl = "invalidVideoUrl"; }
  }
  return errors;
}
