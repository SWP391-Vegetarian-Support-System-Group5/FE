import { notFound } from "next/navigation";
import ContentDetailScreen from "@/components/content/ContentDetailScreen";
import { detailRecipes, getDetailRecipe } from "@/lib/content-detail-data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return detailRecipes.map(recipe => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: Props) {
  const recipe = getDetailRecipe((await params).slug);
  return { title: recipe ? recipe.title[0] : "Recipe not found" };
}

export default async function Page({ params }: Props) {
  const recipe = getDetailRecipe((await params).slug);
  if (!recipe) notFound();
  return <ContentDetailScreen recipe={recipe} />;
}
