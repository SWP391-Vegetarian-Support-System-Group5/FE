import { notFound } from "next/navigation";
import ContentDetailScreen from "@/components/content/ContentDetailScreen";
import { getDetailRecipe } from "@/lib/content-detail-data";

type Props = { params: Promise<{ slug: string }> };

// Community post IDs are created at runtime, independently of the sample slugs.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  if (/^\d+$/.test(slug)) return { title: "Community Recipe" };
  const recipe = getDetailRecipe(slug);
  return { title: recipe ? recipe.title[0] : "Recipe not found" };
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug;
  if (/^\d+$/.test(slug)) return <ContentDetailScreen postId={Number(slug)} />;
  const recipe = getDetailRecipe(slug);
  if (!recipe) notFound();
  return <ContentDetailScreen recipe={recipe} />;
}
