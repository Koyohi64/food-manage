import { z } from "zod";

export const RecipeIngredientSchema = z.object({
    name: z.string(),
    quantity: z.union([z.number(), z.string()]).nullish(),
    unit: z.string().nullish(),
    note: z.string().nullish(),
});

export const RecipeStepSchema = z.object({
    order: z.number().int().min(1),
    description: z.string(),
    tip: z.string().nullish(),
});

export const RecipeContentSchema = z.object({
    description: z.string().nullish(),
    servings: z.number().int().min(1).nullish(),
    cookingTimeMinutes: z.number().int().min(1).nullish(),
    difficulty: z.enum(["easy", "medium", "hard"]).nullish(),
    ingredients: z.array(RecipeIngredientSchema),
    steps: z.array(RecipeStepSchema),
    tags: z.array(z.string()).nullish(),
});

export const MultipleRecipesSchema = z.object({
    recipes: z.array(RecipeContentSchema).min(1),
});

export const AnalyzedIngredientSchema = z.object({
    name: z.string(),
    quantity: z.number().nullish(),
    unit: z.string().nullish(),
    estimatedExpiryDate: z.string().nullish(),
    confidence: z.number().min(0).max(1).nullish(),
});

export const AnalyzedIngredientsSchema = z.object({
    ingredients: z.array(AnalyzedIngredientSchema),
});
