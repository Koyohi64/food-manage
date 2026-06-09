import { sql } from "@/lib/db";
import {
    createId,
    PASSWORD_RESET_TOKEN_TTL_MS,
} from "../../_lib/store";
import {
    errorResponse,
    isEmail,
    jsonResponse,
    readJsonBody,
} from "../../_lib/http";

type PasswordResetRequestBody = {
    email?: unknown;
};

export async function POST(request: Request): Promise<Response> {
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as PasswordResetRequestBody;

    if (!isEmail(body.email)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid email.");
    }

    const recent = await sql`
        SELECT prt.id
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE u.email = ${body.email}
          AND prt.created_at > NOW() - INTERVAL '5 minutes'
        LIMIT 1
    `;
    if (recent.length > 0) {
        return errorResponse(429, "RATE_LIMITED", "Too many requests.");
    }

    const userRows = await sql`SELECT id FROM users WHERE email = ${body.email} LIMIT 1`;
    if (userRows.length > 0) {
        const userId = userRows[0].id as string;

        await sql`
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE user_id = ${userId} AND used_at IS NULL
        `;

        const token = createId();
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS).toISOString();
        await sql`
            INSERT INTO password_reset_tokens (token, user_id, expires_at)
            VALUES (${token}, ${userId}, ${expiresAt})
        `;
    }

    return jsonResponse({ data: { accepted: true } }, 200);
}
