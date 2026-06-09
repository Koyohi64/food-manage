import { sql } from "@/lib/db";
import {
    errorResponse,
    isDateString,
    jsonResponse,
    parseOptionalInt,
    parsePagination,
    readJsonBody,
    requireUser,
    paginate,
} from "../_lib/http";
import {
    rowToIngredient,
    type IngredientSource,
    type StoredIngredient,
} from "../_lib/store";

type IngredientCreate = {
    name?: unknown;
    quantity?: unknown;
    unit?: unknown;
    deadline?: unknown;
    source?: unknown;
};

const allowedSources: IngredientSource[] = ["manual", "receipt", "fridge_photo"];
const allowedSorts = new Set([
    "expiry_asc",
    "expiry_desc",
    "name_asc",
    "name_desc",
    "created_desc",
]);

function toPublicIngredient(ingredient: StoredIngredient) {
    return {
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        deadline: ingredient.deadline,
        source: ingredient.source,
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
    };
}

function validateIngredientCreate(
    input: IngredientCreate,
):
    | {
        ok: true;
        value: {
            name: string;
            quantity: number | null;
            unit: string | null;
            deadline: string | null;
            source: IngredientSource;
        };
    }
    | { ok: false; value: null } {
    if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > 100) {
        return { ok: false, value: null };
    }

    const quantity =
        input.quantity === undefined || input.quantity === null
            ? null
            : typeof input.quantity === "number" && input.quantity >= 0
                ? input.quantity
                : null;
    if (input.quantity !== undefined && input.quantity !== null && quantity === null) {
        return { ok: false, value: null };
    }

    const unit =
        input.unit === undefined || input.unit === null
            ? null
            : typeof input.unit === "string" && input.unit.length <= 20
                ? input.unit
                : null;
    if (input.unit !== undefined && input.unit !== null && unit === null) {
        return { ok: false, value: null };
    }

    const deadline =
        input.deadline === undefined || input.deadline === null
            ? null
            : isDateString(input.deadline)
                ? input.deadline
                : null;
    if (input.deadline !== undefined && input.deadline !== null && deadline === null) {
        return { ok: false, value: null };
    }

    if (input.source === undefined || !allowedSources.includes(input.source as IngredientSource)) {
        return { ok: false, value: null };
    }

    return {
        ok: true,
        value: {
            name: input.name,
            quantity,
            unit,
            deadline,
            source: input.source as IngredientSource,
        },
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

    const sort = url.searchParams.get("sort") ?? "expiry_asc";
    if (!allowedSorts.has(sort)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid sort value.");
    }

    const expiringRaw = url.searchParams.get("expiringWithinDays");
    const expiringWithinDays = parseOptionalInt(expiringRaw);
    if (expiringRaw !== null && (expiringWithinDays === null || expiringWithinDays < 0)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid expiringWithinDays value.");
    }

    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const now = new Date();

    const rows = await sql`SELECT * FROM ingredients WHERE user_id = ${auth.user.id}`;
    let items = rows.map((r) => rowToIngredient(r as Record<string, unknown>));

    if (search) {
        items = items.filter((item) => item.name.toLowerCase().includes(search));
    }

    if (expiringWithinDays !== null) {
        const limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + expiringWithinDays);
        items = items.filter((item) => {
            if (!item.deadline) {
                return false;
            }
            return new Date(item.deadline) <= limitDate;
        });
    }

    items.sort((a, b) => {
        switch (sort) {
            case "expiry_desc":
                return (b.deadline ?? "9999-12-31").localeCompare(a.deadline ?? "9999-12-31");
            case "name_asc":
                return a.name.localeCompare(b.name);
            case "name_desc":
                return b.name.localeCompare(a.name);
            case "created_desc":
                return b.createdAt.localeCompare(a.createdAt);
            case "expiry_asc":
            default:
                return (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31");
        }
    });

    const paged = paginate(items.map(toPublicIngredient), pagination.page, pagination.limit);
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

    const body = bodyResult.value as { ingredients?: unknown };
    if (!Array.isArray(body.ingredients) || body.ingredients.length < 1 || body.ingredients.length > 100) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredients payload.");
    }

    const validated: Array<{
        name: string;
        quantity: number | null;
        unit: string | null;
        deadline: string | null;
        source: IngredientSource;
    }> = [];

    for (const item of body.ingredients) {
        const result = validateIngredientCreate(item as IngredientCreate);
        if (!result.ok) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredients payload.");
        }
        validated.push(result.value);
    }

    const upserted: StoredIngredient[] = [];
    for (const v of validated) {
        // 同じ名前・同じ期限の既存レコードを検索
        const existing = await sql`
            SELECT * FROM ingredients
            WHERE user_id = ${auth.user.id}
              AND name = ${v.name}
              AND (
                (deadline IS NULL AND ${v.deadline}::date IS NULL)
                OR deadline = ${v.deadline}::date
              )
            LIMIT 1
        `;

        if (existing.length > 0) {
            const curr = rowToIngredient(existing[0] as Record<string, unknown>);
            const mergedQty =
                curr.quantity !== null && v.quantity !== null
                    ? curr.quantity + v.quantity
                    : (curr.quantity ?? v.quantity);

            const rows = await sql`
                UPDATE ingredients
                SET quantity = ${mergedQty}, updated_at = NOW()
                WHERE id = ${curr.id}
                RETURNING *
            `;
            upserted.push(rowToIngredient(rows[0] as Record<string, unknown>));
        } else {
            const rows = await sql`
                INSERT INTO ingredients (user_id, name, quantity, unit, deadline, source)
                VALUES (${auth.user.id}, ${v.name}, ${v.quantity}, ${v.unit}, ${v.deadline}, ${v.source})
                RETURNING *
            `;
            upserted.push(rowToIngredient(rows[0] as Record<string, unknown>));
        }
    }

    return jsonResponse(
        {
            data: {
                insertedCount: upserted.length,
                ingredients: upserted.map(toPublicIngredient),
            },
        },
        201,
    );
}
