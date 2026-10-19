import { notFound } from "next/navigation";
import ContentDetailScreen from "@/components/content/ContentDetailScreen";
import CommunityPostDetail from "@/components/content/CommunityPostDetail";
import { getDetailRecipe } from "@/lib/content-detail-data";

type Props = { params: Promise<{ slug: string }> };

// Community post IDs are created at runtime, independently of the sample slugs.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  if (/^(?:post-)?[1-9]\d*$/.test(slug)) return { title: "Community | VeggieMate" };
  const recipe = getDetailRecipe(slug);
  return { title: recipe ? recipe.title[0] : "Recipe not found" };
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug;
  if (/^post-[1-9]\d*$/.test(slug)) {
    const postId = Number(slug.slice(5));
    if (!Number.isSafeInteger(postId)) notFound();
    return <CommunityPostDetail postId={postId} />;
  }
  if (/^[1-9]\d*$/.test(slug)) {
    const postId = Number(slug);
    if (!Number.isSafeInteger(postId)) notFound();
    return <ContentDetailScreen postId={postId} />;
  }
  const recipe = getDetailRecipe(slug);
  if (!recipe) notFound();
  return <ContentDetailScreen recipe={recipe} />;
}
