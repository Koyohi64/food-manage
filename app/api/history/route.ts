import { sql } from "@/lib/db";
import {
    errorResponse,
    isUuid,
    jsonResponse,
    parsePagination,
    readJsonBody,
    requireUser,
    paginate,
} from "../_lib/http";
import {
    rowToIngredient,
    rowToCookingLog,
    type UsedIngredient,
} from "../_lib/store";

type HistoryCreateBody = {
    recipeId?: unknown;
    consumedIngredients?: unknown;
};

type ConsumedIngredient = {
    ingredientId: string;
    quantity: number;
};

export async function GET(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const url = new URL(request.url);
    const pagination = parsePagination(url, 20);
    if ("response" in pagination) {
        return pagination.response;
    }

    const rows = await sql`
        SELECT * FROM recipe_histories
        WHERE user_id = ${auth.user.id}
        ORDER BY created_at DESC
    `;

    const logs = rows.map((r) => rowToCookingLog(r as Record<string, unknown>));
    const paged = paginate(logs, pagination.page, pagination.limit);
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
    const body = bodyResult.value as HistoryCreateBody;

    if (!isUuid(body.recipeId)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipeId.");
    }

    if (!Array.isArray(body.consumedIngredients)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid consumedIngredients.");
    }

    const consumed: ConsumedIngredient[] = [];
    for (const item of body.consumedIngredients) {
        if (!item || typeof item !== "object") {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid consumedIngredients.");
        }
        const ingredientId = (item as { ingredientId?: unknown }).ingredientId;
        const quantity = (item as { quantity?: unknown }).quantity;
        if (!isUuid(ingredientId)) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredientId.");
        }
        if (typeof quantity !== "number" || quantity < 0) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid quantity.");
        }
        consumed.push({ ingredientId, quantity });
    }

    const recipeRows = await sql`
        SELECT id, name FROM recipes WHERE id = ${body.recipeId} AND user_id = ${auth.user.id} LIMIT 1
    `;
    if (recipeRows.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Recipe not found.");
    }
    const recipe = recipeRows[0];

    const ingredientRows = await sql`
        SELECT * FROM ingredients WHERE user_id = ${auth.user.id}
    `;
    const ingredientMap = new Map(
        ingredientRows.map((r) => [r.id as string, rowToIngredient(r as Record<string, unknown>)])
    );

    for (const item of consumed) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (!ingredient) {
            return errorResponse(404, "NOT_FOUND", "Ingredient not found.");
        }
        if (item.quantity === 0) continue;
        if (ingredient.quantity === null || ingredient.quantity < item.quantity) {
            return errorResponse(400, "INSUFFICIENT_STOCK", "Insufficient stock.");
        }
    }

    const usedIngredients: UsedIngredient[] = [];
    for (const item of consumed) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (!ingredient) continue;
        usedIngredients.push({
            name: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit,
        });

        if (item.quantity === 0 || ingredient.quantity === null) continue;
        const newQty = ingredient.quantity - item.quantity;
        if (newQty <= 0) {
            await sql`DELETE FROM ingredients WHERE id = ${item.ingredientId}`;
        } else {
            await sql`UPDATE ingredients SET quantity = ${newQty}, updated_at = NOW() WHERE id = ${item.ingredientId}`;
        }
    }

    const historyRows = await sql`
        INSERT INTO recipe_histories (user_id, recepi_id, name, used_ingredients)
        VALUES (${auth.user.id}, ${body.recipeId}, ${recipe.name as string}, ${JSON.stringify(usedIngredients)})
        RETURNING *
    `;

    const log = rowToCookingLog(historyRows[0] as Record<string, unknown>);
    return jsonResponse({ data: log }, 201);
}
