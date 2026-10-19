import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import type { DetailRecipe } from "@/lib/content-detail-data";
import ContentDetail from "./ContentDetail";
import PostContentDetail from "./PostContentDetail";

export default function ContentDetailScreen({ recipe, postId }: { recipe?: DetailRecipe; postId?: number }) {
  return <><Navbar />{postId ? <PostContentDetail postId={postId} /> : recipe ? <ContentDetail key={recipe.slug} recipe={recipe} /> : null}<Footer /><VeggieAIWidget /></>;
}
