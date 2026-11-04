import type { Metadata } from "next";
import CreateContentPageShell from "@/components/recipe/CreateContentPageShell";

export const metadata: Metadata = {
  title: "Tạo bài viết | VeggieMate",
  description:
    "Chia sẻ công thức nấu ăn thuần chay, phân tích video với AI hoặc viết công thức thủ công trên VeggieMate.",
};

export default function CreateContentPage() {
  return <CreateContentPageShell />;
}
