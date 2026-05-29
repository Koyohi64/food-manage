import AppShell from "@/app/_components/AppShell";

import RecipeForm from "../_components/RecipeForm";

export default function RecipeNewPage() {
  return (
    <AppShell>
      <RecipeForm mode="create" />
    </AppShell>
  );
}
