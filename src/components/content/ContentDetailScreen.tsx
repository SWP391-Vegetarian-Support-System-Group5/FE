import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import type { DetailRecipe } from "@/lib/content-detail-data";
import ContentDetail from "./ContentDetail";

export default function ContentDetailScreen({ recipe }: { recipe: DetailRecipe }) {
  return <><Navbar /><ContentDetail key={recipe.slug} recipe={recipe} /><Footer /><VeggieAIWidget /></>;
}
