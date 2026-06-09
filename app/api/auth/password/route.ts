import { sql } from "@/lib/db";
import {
    hashPassword,
} from "../../_lib/store";
import {
    errorResponse,
    jsonResponse,
    readJsonBody,
} from "../../_lib/http";

type PasswordResetBody = {
    token?: unknown;
    newPassword?: unknown;
};

function isValidPassword(value: unknown): value is string {
    return typeof value === "string" && value.length >= 8 && value.length <= 72;
}

export async function PUT(request: Request): Promise<Response> {
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as PasswordResetBody;

    if (typeof body.token !== "string" || !isValidPassword(body.newPassword)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid password reset payload.");
    }

    const tokenRows = await sql`
        SELECT token, user_id, expires_at, used_at
        FROM password_reset_tokens
        WHERE token = ${body.token}
        LIMIT 1
    `;
    if (tokenRows.length === 0) {
        return errorResponse(401, "INVALID_TOKEN", "Invalid token.");
    }

    const tokenRow = tokenRows[0];
    if (tokenRow.used_at) {
        return errorResponse(401, "INVALID_TOKEN", "Token already used.");
    }

    if (new Date(tokenRow.expires_at as Date).getTime() <= Date.now()) {
        return errorResponse(401, "EXPIRED", "Token expired.");
    }

    const userId = tokenRow.user_id as string;
    await sql`UPDATE users SET password = ${await hashPassword(body.newPassword)}, updated_at = NOW() WHERE id = ${userId}`;
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${body.token}`;
    await sql`
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = ${userId} AND token != ${body.token} AND used_at IS NULL
    `;

    return jsonResponse({ data: { updated: true } }, 200);
}
