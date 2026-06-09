import { sql } from "@/lib/db";
import { jsonResponse, requireUser } from "../_lib/http";

export async function GET(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const userId = auth.user.id;

    const [ingredientRow, recipeRow, expiringRow] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM ingredients WHERE user_id = ${userId}`,
        sql`SELECT COUNT(*)::int AS count FROM recipes WHERE user_id = ${userId}`,
        sql`SELECT COUNT(*)::int AS count FROM ingredients WHERE user_id = ${userId} AND deadline IS NOT NULL AND deadline <= NOW() + INTERVAL '3 days'`,
    ]);

    return jsonResponse({
        data: {
            ingredientCount: ingredientRow[0].count as number,
            recipeCount: recipeRow[0].count as number,
            expiringCount: expiringRow[0].count as number,
        },
    });
}
