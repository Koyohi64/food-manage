import { sql } from "@/lib/db";
import {
    createId,
    verifyPassword,
    rowToUser,
} from "../../_lib/store";
import {
    errorResponse,
    isEmail,
    jsonResponse,
    readJsonBody,
    setSessionCookie,
} from "../../_lib/http";

type LoginBody = {
    email?: unknown;
    password?: unknown;
};

function isValidPassword(value: unknown): value is string {
    return typeof value === "string" && value.length >= 1;
}

export async function POST(request: Request): Promise<Response> {
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as LoginBody;

    if (!isEmail(body.email) || !isValidPassword(body.password)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid login payload.");
    }

    const rows = await sql`
        SELECT id, name, email, password, created_at, updated_at
        FROM users
        WHERE email = ${body.email}
        LIMIT 1
    `;
    if (rows.length === 0 || !(await verifyPassword(body.password as string, rows[0].password as string))) {
        return errorResponse(401, "UNAUTHORIZED", "Invalid credentials.");
    }

    const user = rowToUser(rows[0] as Record<string, unknown>);
    const token = createId();
    await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${user.id})`;
    await setSessionCookie(token);

    return jsonResponse({
        data: {
            id: user.id,
            username: user.name,
            email: user.email,
        },
    });
}
