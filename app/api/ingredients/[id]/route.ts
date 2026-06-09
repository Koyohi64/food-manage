import { sql } from "@/lib/db";
import {
    errorResponse,
    isDateString,
    isUuid,
    jsonResponse,
    noContentResponse,
    readJsonBody,
    requireUser,
} from "../../_lib/http";
import {
    rowToIngredient,
    type IngredientSource,
    type StoredIngredient,
} from "../../_lib/store";

type IngredientUpdate = {
    name?: unknown;
    quantity?: unknown;
    unit?: unknown;
    deadline?: unknown;
    source?: unknown;
};

const allowedSources: IngredientSource[] = ["manual", "receipt", "fridge_photo"];

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

function validateIngredientUpdate(input: IngredientUpdate): {
    ok: true;
    updates: Partial<Pick<StoredIngredient, "name" | "quantity" | "unit" | "deadline" | "source">>;
} | { ok: false; updates: null } {
    const updates: Partial<Pick<StoredIngredient, "name" | "quantity" | "unit" | "deadline" | "source">> = {};

    if (input.name !== undefined) {
        if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > 100) {
            return { ok: false, updates: null };
        }
        updates.name = input.name;
    }

    if (input.quantity !== undefined) {
        if (input.quantity === null) {
            updates.quantity = null;
        } else if (typeof input.quantity === "number" && input.quantity >= 0) {
            updates.quantity = input.quantity;
        } else {
            return { ok: false, updates: null };
        }
    }

    if (input.unit !== undefined) {
        if (input.unit === null) {
            updates.unit = null;
        } else if (typeof input.unit === "string" && input.unit.length <= 20) {
            updates.unit = input.unit;
        } else {
            return { ok: false, updates: null };
        }
    }

    if (input.deadline !== undefined) {
        if (input.deadline === null) {
            updates.deadline = null;
        } else if (isDateString(input.deadline)) {
            updates.deadline = input.deadline;
        } else {
            return { ok: false, updates: null };
        }
    }

    if (input.source !== undefined) {
        if (!allowedSources.includes(input.source as IngredientSource)) {
            return { ok: false, updates: null };
        }
        updates.source = input.source as IngredientSource;
    }

    return { ok: true, updates };
}

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
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredient id.");
    }

    const rows = await sql`SELECT * FROM ingredients WHERE id = ${id} AND user_id = ${auth.user.id} LIMIT 1`;
    if (rows.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Ingredient not found.");
    }

    return jsonResponse({ data: toPublicIngredient(rowToIngredient(rows[0] as Record<string, unknown>)) });
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredient id.");
    }

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const validation = validateIngredientUpdate(bodyResult.value as IngredientUpdate);
    if (!validation.ok) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredient payload.");
    }
    if (Object.keys(validation.updates).length === 0) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredient payload.");
    }

    const existing = await sql`SELECT * FROM ingredients WHERE id = ${id} AND user_id = ${auth.user.id} LIMIT 1`;
    if (existing.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Ingredient not found.");
    }

    const u = validation.updates;
    const curr = rowToIngredient(existing[0] as Record<string, unknown>);
    const rows = await sql`
        UPDATE ingredients SET
            name     = ${u.name     !== undefined ? u.name     : curr.name},
            quantity = ${u.quantity !== undefined ? u.quantity : curr.quantity},
            unit     = ${u.unit     !== undefined ? u.unit     : curr.unit},
            deadline = ${u.deadline !== undefined ? u.deadline : curr.deadline},
            source   = ${u.source   !== undefined ? u.source   : curr.source},
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${auth.user.id}
        RETURNING *
    `;

    return jsonResponse({ data: toPublicIngredient(rowToIngredient(rows[0] as Record<string, unknown>)) });
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const { id } = await context.params;
    if (!isUuid(id)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredient id.");
    }

    const result = await sql`DELETE FROM ingredients WHERE id = ${id} AND user_id = ${auth.user.id} RETURNING id`;
    if (result.length === 0) {
        return errorResponse(404, "NOT_FOUND", "Ingredient not found.");
    }

    return noContentResponse();
}
