import { sql } from "@/lib/db";
import {
    errorResponse,
    jsonResponse,
    parsePagination,
    readJsonBody,
    requireUser,
    paginate,
} from "../_lib/http";
import {
    rowToRecipe,
    type RecipeContent,
    type RecipeDifficulty,
    type StoredRecipe,
} from "../_lib/store";

type RecipeCreateBody = {
    name?: unknown;
    content?: unknown;
};

const allowedSorts = new Set([
    "created_desc",
    "last_cooked_desc",
    "cook_count_desc",
    "name_asc",
]);

function isRecipeDifficulty(value: unknown): value is RecipeDifficulty {
    return value === "easy" || value === "medium" || value === "hard";
}

function validateRecipeContent(input: unknown): input is RecipeContent {
    if (!input || typeof input !== "object") {
        return false;
    }
    const content = input as RecipeContent;
    if (!Array.isArray(content.ingredients) || content.ingredients.length === 0) {
        return false;
    }
    if (!Array.isArray(content.steps) || content.steps.length === 0) {
        return false;
    }
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

type RecipeWithStats = StoredRecipe & { cookCount: number; lastCookedAt: string | null };

function buildRecipeResponse(r: RecipeWithStats) {
    return {
        id: r.id,
        name: r.name,
        content: r.content,
        cookCount: r.cookCount,
        lastCookedAt: r.lastCookedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}

export async function GET(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const url = new URL(request.url);
    const pagination = parsePagination(url, 50);
    if ("response" in pagination) {
        return pagination.response;
    }

    const sort = url.searchParams.get("sort") ?? "created_desc";
    if (!allowedSorts.has(sort)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid sort value.");
    }

    const search = url.searchParams.get("search")?.toLowerCase() ?? "";

    const rows = await sql`
        SELECT
            r.id, r.user_id, r.name, r.content, r.created_at, r.updated_at,
            COUNT(rh.id)::int AS cook_count,
            MAX(rh.created_at) AS last_cooked_at
        FROM recipes r
        LEFT JOIN recipe_histories rh ON rh.recepi_id = r.id
        WHERE r.user_id = ${auth.user.id}
        GROUP BY r.id
    `;

    let items: RecipeWithStats[] = rows.map((row) => ({
        ...rowToRecipe(row as Record<string, unknown>),
        cookCount: row.cook_count as number,
        lastCookedAt: row.last_cooked_at ? (row.last_cooked_at as Date).toISOString() : null,
    }));

    if (search) {
        items = items.filter((r) => r.name.toLowerCase().includes(search));
    }

    items.sort((a, b) => {
        switch (sort) {
            case "last_cooked_desc":
                return (b.lastCookedAt ?? "").localeCompare(a.lastCookedAt ?? "");
            case "cook_count_desc":
                return b.cookCount - a.cookCount;
            case "name_asc":
                return a.name.localeCompare(b.name);
            case "created_desc":
            default:
                return b.createdAt.localeCompare(a.createdAt);
        }
    });

    const paged = paginate(items.map(buildRecipeResponse), pagination.page, pagination.limit);
    return jsonResponse({ data: paged.data, pagination: paged.pagination });
}

export async function POST(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const body = bodyResult.value as RecipeCreateBody;
    if (typeof body.name !== "string" || body.name.length < 1 || body.name.length > 200) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe name.");
    }

    if (!validateRecipeContent(body.content)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe content.");
    }

    const rows = await sql`
        INSERT INTO recipes (user_id, name, content)
        VALUES (${auth.user.id}, ${body.name}, ${JSON.stringify(body.content)})
        RETURNING id, user_id, name, content, created_at, updated_at
    `;
    const recipe: RecipeWithStats = {
        ...rowToRecipe(rows[0] as Record<string, unknown>),
        cookCount: 0,
        lastCookedAt: null,
    };

    return jsonResponse({ data: buildRecipeResponse(recipe) }, 201);
}
