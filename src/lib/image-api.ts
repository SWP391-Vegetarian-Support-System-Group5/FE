import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

export interface ImageMutationResponse {
  imageUrl: string | null;
  isGenerated: boolean;
  previousImageDeleted: boolean;
}

export class ImageRequestError extends Error {
  constructor(public readonly status: number, message: string, public readonly retryAfter?: string | null) {
    super(message);
    this.name = "ImageRequestError";
  }
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export function validateImage(file: File) {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) throw new ImageRequestError(415, "Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
  if (file.size > 5 * 1024 * 1024) throw new ImageRequestError(413, "Ảnh phải có dung lượng tối đa 5 MB.");
  if (!file.size) throw new ImageRequestError(415, "Tệp ảnh đang trống.");
}

export function imageError(error: unknown): string {
  if (!(error instanceof ImageRequestError)) return "Không thể kết nối máy chủ. Ảnh hiện tại được giữ nguyên, vui lòng thử lại.";
  const messages: Record<number, string> = {
    400: "Dữ liệu ảnh không hợp lệ. Kiểm tra tệp và mô tả tạo ảnh.",
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền thay đổi ảnh này.",
    404: "Không tìm thấy nội dung hoặc món ăn. Vui lòng tải lại dữ liệu.",
    409: "Ảnh hoặc món ăn vừa thay đổi. Hãy tải lại dữ liệu trước khi thử lại.",
    413: "Ảnh vượt quá dung lượng tối đa 5 MB.",
    415: "Định dạng không hợp lệ. Chỉ nhận ảnh JPEG, PNG hoặc WebP.",
    429: "Đã hết hạn mức hoặc gửi yêu cầu quá nhanh. Tạo ảnh AI tối đa 3 yêu cầu/phút/người dùng. Vui lòng chờ rồi thử lại.",
    502: "Dịch vụ ảnh đang gặp lỗi. Ảnh hiện tại được giữ nguyên, vui lòng thử lại sau.",
    503: "Dịch vụ ảnh chưa sẵn sàng hoặc chưa được cấu hình. Ảnh hiện tại được giữ nguyên.",
  };
  return [messages[error.status] || "Không thể xử lý ảnh.", error.message].filter(Boolean).join(" ");
}

async function mutateImage(path: string, method: string, body?: BodyInit): Promise<ImageMutationResponse> {
  if (!getStoredToken()) throw new ImageRequestError(401, "");
  const response = await apiFetch(path, {
    method, body, cache: "no-store",
    ...(typeof body === "string" ? { headers: { "Content-Type": "application/json" } } : {}),
  });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const fields = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const message = [fields.message, fields.detail, fields.title].find(value => typeof value === "string");
    throw new ImageRequestError(response.status, typeof message === "string" ? message : "", response.headers.get("Retry-After"));
  }
  return await response.json() as ImageMutationResponse;
}

function upload(path: string, file: File) {
  validateImage(file);
  const form = new FormData();
  form.append("file", file);
  return mutateImage(path, "PUT", form);
}

export const uploadAvatar = (file: File) => upload("/api/users/me/avatar", file);
export const deleteAvatar = () => mutateImage("/api/users/me/avatar", "DELETE");
export const uploadPostImage = (postId: number, file: File) => upload(`/api/posts/${postId}/image`, file);
export const deletePostImage = (postId: number) => mutateImage(`/api/posts/${postId}/image`, "DELETE");
const mealPath = (planId: number, mealId: number) => `/api/meal-plans/${planId}/meals/${mealId}/image`;
export const uploadMealImage = (planId: number, mealId: number, file: File) => upload(mealPath(planId, mealId), file);
export const deleteMealImage = (planId: number, mealId: number) => mutateImage(mealPath(planId, mealId), "DELETE");
export function generateMealImage(planId: number, mealId: number, style?: string) {
  if (style && style.length > 300) throw new ImageRequestError(400, "Mô tả ảnh tối đa 300 ký tự.");
  return mutateImage(`${mealPath(planId, mealId)}/generate`, "POST", JSON.stringify(style?.trim() ? { style: style.trim() } : {}));
}
