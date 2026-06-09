import { sql } from "@/lib/db";
import {
    errorResponse,
    isUuid,
    jsonResponse,
    noContentResponse,
    readJsonBody,
    requireUser,
} from "../../_lib/http";
import {
    rowToRecipe,
    type RecipeContent,
    type RecipeDifficulty,
    type StoredRecipe,
} from "../../_lib/store";

type RecipeUpdateBody = {
    name?: unknown;
    content?: unknown;
};

function isRecipeDifficulty(value: unknown): value is RecipeDifficulty {
    return value === "easy" || value === "medium" || value === "hard";
}

function validateRecipeContent(input: unknown): input is RecipeContent {
    if (!input || typeof input !== "object") return false;
    const content = input as RecipeContent;
    if (!Array.isArray(content.ingredients) || content.ingredients.length === 0) return false;
    if (!Array.isArray(content.steps) || content.steps.length === 0) return false;
    for (const ingredient of content.ingredients) {
        if (!ingredient || typeof ingredient !== "object") return false;
        if (typeof ingredient.name !== "string" || ingredient.name.length === 0) return false;
        if (ingredient.quantity !== undefined && ingredient.quantity !== null &&
            typeof ingredient.quantity !== "number" && typeof ingredient.quantity !== "string") return false;
        if (ingredient.unit !== undefined && ingredient.unit !== null && typeof ingredient.unit !== "string") return false;
        if (ingredient.note !== undefined && ingredient.note !== null && typeof ingredient.note !== "string") return false;
    }
    for (const step of content.steps) {
        if (!step || typeof step !== "object") return false;
        if (typeof step.order !== "number" || !Number.isInteger(step.order)) return false;
        if (typeof step.description !== "string" || step.description.length === 0) return false;
        if (step.tip !== undefined && step.tip !== null && typeof step.tip !== "string") return false;
    }
    if (content.servings !== undefined && content.servings !== null &&
        (typeof content.servings !== "number" || !Number.isInteger(content.servings) || content.servings < 1)) return false;
    if (content.cookingTimeMinutes !== undefined && content.cookingTimeMinutes !== null &&
        (typeof content.cookingTimeMinutes !== "number" || !Number.isInteger(content.cookingTimeMinutes) || content.cookingTimeMinutes < 1)) return false;
    if (content.difficulty !== undefined && content.difficulty !== null && !isRecipeDifficulty(content.difficulty)) return false;
    if (content.tags !== undefined && content.tags !== null &&
        (!Array.isArray(content.tags) || content.tags.some((t) => typeof t !== "string"))) return false;
    if (content.description !== undefined && content.description !== null && typeof content.description !== "string") return false;
    return true;
}

async function getRecipeWithStats(recipeId: string, userId: string) {
    const rows = await sql`
        SELECT
            r.id, r.user_id, r.name, r.content, r.created_at, r.updated_at,
            COUNT(rh.id)::int AS cook_count,
            MAX(rh.created_at) AS last_cooked_at
        FROM recipes r
        LEFT JOIN recipe_histories rh ON rh.recepi_id = r.id
        WHERE r.id = ${recipeId} AND r.user_id = ${userId}
        GROUP BY r.id
        LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        recipe: rowToRecipe(row as Record<string, unknown>),
        cookCount: row.cook_count as number,
        lastCookedAt: row.last_cooked_at ? (row.last_cooked_at as Date).toISOString() : null,
    };
}

function buildRecipeResponse(recipe: StoredRecipe, cookCount: number, lastCookedAt: string | null) {
    return {
        id: recipe.id,
        name: recipe.name,
        content: recipe.content,
        cookCount,
        lastCookedAt,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
    };
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe id.");
    }

    const result = await getRecipeWithStats(id, auth.user.id);
    if (!result) {
        return errorResponse(404, "NOT_FOUND", "Recipe not found.");
    }

    return jsonResponse({ data: buildRecipeResponse(result.recipe, result.cookCount, result.lastCookedAt) });
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe id.");
    }

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;

    const body = bodyResult.value as RecipeUpdateBody;
    const updates: Partial<Pick<StoredRecipe, "name" | "content">> = {};

    if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.length < 1 || body.name.length > 200) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe name.");
        }
        updates.name = body.name;
    }

    if (body.content !== undefined) {
        if (!validateRecipeContent(body.content)) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe content.");
        }
        updates.content = body.content;
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(400, "VALIDATION_ERROR", "No recipe fields to update.");
    }

    const existing = await sql`SELECT * FROM recipes WHERE id = ${id} AND user_id = ${auth.user.id} LIMIT 1`;
    if (existing.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Recipe not found.");
    }

    const curr = rowToRecipe(existing[0] as Record<string, unknown>);
    const newName = updates.name ?? curr.name;
    const newContent = updates.content ?? curr.content;

    await sql`
        UPDATE recipes SET name = ${newName}, content = ${JSON.stringify(newContent)}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${auth.user.id}
    `;

    if (updates.name !== undefined) {
        await sql`
            UPDATE recipe_histories SET name = ${newName}
            WHERE recepi_id = ${id} AND user_id = ${auth.user.id}
        `;
    }

    const result = await getRecipeWithStats(id, auth.user.id);
    return jsonResponse({ data: buildRecipeResponse(result!.recipe, result!.cookCount, result!.lastCookedAt) });
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe id.");
    }

    const result = await sql`DELETE FROM recipes WHERE id = ${id} AND user_id = ${auth.user.id} RETURNING id`;
    if (result.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Recipe not found.");
    }

    return noContentResponse();
}
