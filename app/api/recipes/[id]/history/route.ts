import { sql } from "@/lib/db";
import {
    errorResponse,
    isUuid,
    jsonResponse,
    parsePagination,
    requireUser,
    paginate,
} from "../../../_lib/http";
import { rowToCookingLog } from "../../../_lib/store";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid recipe id.");
    }

    const recipeRows = await sql`
        SELECT id FROM recipes WHERE id = ${id} AND user_id = ${auth.user.id} LIMIT 1
    `;
    if (recipeRows.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Recipe not found.");
    }

    const url = new URL(request.url);
    const pagination = parsePagination(url, 20);
    if ("response" in pagination) {
        return pagination.response;
    }

    const rows = await sql`
        SELECT * FROM recipe_histories
        WHERE user_id = ${auth.user.id} AND recepi_id = ${id}
        ORDER BY created_at DESC
    `;

    const logs = rows.map((r) => rowToCookingLog(r as Record<string, unknown>));
    const paged = paginate(logs, pagination.page, pagination.limit);
    return jsonResponse({ data: paged.data, pagination: paged.pagination });
}
