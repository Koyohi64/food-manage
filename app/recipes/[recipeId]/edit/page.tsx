import AppShell from "@/app/_components/AppShell";

import RecipeForm from "../../_components/RecipeForm";

export default async function RecipeEditPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;

  return (
    <AppShell>
      <RecipeForm mode="edit" recipeId={recipeId} />
    </AppShell>
  );
}
