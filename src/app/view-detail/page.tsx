import ContentDetailScreen from "@/components/content/ContentDetailScreen";
import { detailRecipes } from "@/lib/content-detail-data";

export const metadata = { title: "Đậu hũ sốt cà chua" };

export default function Page() {
  return <ContentDetailScreen recipe={detailRecipes[0]} />;
}
