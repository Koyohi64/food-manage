import { sql } from "@/lib/db";
import {
    verifyPassword,
    rowToUser,
} from "../_lib/store";
import {
    clearSessionCookie,
    errorResponse,
    isEmail,
    jsonResponse,
    noContentResponse,
    readJsonBody,
    requireUser,
} from "../_lib/http";

type UpdateProfileBody = {
    name?: unknown;
    email?: unknown;
};

type DeleteAccountBody = {
    password?: unknown;
};

function isValidName(value: unknown): value is string {
    return typeof value === "string" && value.length >= 1 && value.length <= 50;
}

export async function GET(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const user = auth.user;
    return jsonResponse({
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
}

export async function PUT(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as UpdateProfileBody;
    const updates: Partial<{ name: string; email: string }> = {};

    if (body.name !== undefined) {
        if (!isValidName(body.name)) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid name.");
        }
        updates.name = body.name as string;
    }

    if (body.email !== undefined) {
        if (!isEmail(body.email)) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid email.");
        }
        updates.email = body.email;
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(400, "VALIDATION_ERROR", "No fields to update.");
    }

    const user = auth.user;
    if (updates.email && updates.email !== user.email) {
        const existing = await sql`SELECT id FROM users WHERE email = ${updates.email} LIMIT 1`;
        if (existing.length > 0 && (existing[0].id as string) !== user.id) {
            return errorResponse(409, "CONFLICT", "Email already registered.");
        }
    }

    let rows;
    if (updates.name && updates.email) {
        rows = await sql`
            UPDATE users SET name = ${updates.name}, email = ${updates.email}, updated_at = NOW()
            WHERE id = ${user.id}
            RETURNING id, name, email, password, created_at, updated_at
        `;
    } else if (updates.name) {
        rows = await sql`
            UPDATE users SET name = ${updates.name}, updated_at = NOW()
            WHERE id = ${user.id}
            RETURNING id, name, email, password, created_at, updated_at
        `;
    } else {
        rows = await sql`
            UPDATE users SET email = ${updates.email!}, updated_at = NOW()
            WHERE id = ${user.id}
            RETURNING id, name, email, password, created_at, updated_at
        `;
    }

    const updated = rowToUser(rows[0] as Record<string, unknown>);
    return jsonResponse({
        data: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
        },
    });
}

export async function DELETE(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as DeleteAccountBody;
    if (typeof body.password !== "string" || body.password.length === 0) {
        return errorResponse(400, "VALIDATION_ERROR", "Password is required.");
    }

    const user = auth.user;
    if (!(await verifyPassword(body.password, user.passwordHash))) {
        return errorResponse(401, "UNAUTHORIZED", "Invalid password.");
    }

    await sql`DELETE FROM users WHERE id = ${user.id}`;
    await clearSessionCookie();
    return noContentResponse();
}
