import { apiUpload, type UploadOptions } from "@/lib/api";

export type ImagePurpose = "recipes" | "restaurants" | "categories";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadImage(file: File, purpose: ImagePurpose, options: UploadOptions = {}): Promise<string> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Ảnh phải có dung lượng từ 1 byte đến 8 MB.");
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF.");

  const body = new FormData();
  body.append("image", file);
  const response = await apiUpload(`/api/media/images?purpose=${purpose}`, body, options);
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message || `Tải ảnh lên Cloudinary thất bại (${response.status}).`);
  }
  const data = await response.json() as { imageUrl?: string };
  if (!data.imageUrl?.startsWith("https://res.cloudinary.com/")) throw new Error("Cloudinary chưa trả URL ảnh hợp lệ.");
  return data.imageUrl;
}
