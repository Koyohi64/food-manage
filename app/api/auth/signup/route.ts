import { sql } from "@/lib/db";
import {
    DEFAULT_SETTINGS,
    createId,
    hashPassword,
    rowToUser,
} from "../../_lib/store";
import {
    errorResponse,
    isEmail,
    jsonResponse,
    readJsonBody,
    setSessionCookie,
} from "../../_lib/http";

type SignupBody = {
    name?: unknown;
    email?: unknown;
    password?: unknown;
};

function isValidName(value: unknown): value is string {
    return typeof value === "string" && value.length >= 1 && value.length <= 50;
}

function isValidPassword(value: unknown): value is string {
    return typeof value === "string" && value.length >= 8 && value.length <= 72;
}

export async function POST(request: Request): Promise<Response> {
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
        return bodyResult.response;
    }
    const body = bodyResult.value as SignupBody;

    if (!isValidName(body.name)) {
        return errorResponse(400, "VALIDATION_ERROR", "ユーザー名は1〜50文字で入力してください。");
    }
    if (!isEmail(body.email)) {
        return errorResponse(400, "VALIDATION_ERROR", "有効なメールアドレスを入力してください。");
    }
    if (!isValidPassword(body.password)) {
        return errorResponse(400, "VALIDATION_ERROR", "パスワードは8文字以上72文字以下で入力してください。");
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${body.email} LIMIT 1`;
    if (existing.length > 0) {
        return errorResponse(409, "CONFLICT", "Email already registered.");
    }

    const passwordHash = await hashPassword(body.password);
    const userRows = await sql`
        INSERT INTO users (name, email, password)
        VALUES (${body.name}, ${body.email}, ${passwordHash})
        RETURNING id, name, email, created_at, updated_at
    `;
    const user = rowToUser({ ...userRows[0], password: passwordHash } as Record<string, unknown>);

    await sql`
        INSERT INTO user_settings (user_id, warning_day, notification_enabled, theme)
        VALUES (${user.id}, ${DEFAULT_SETTINGS.warningDay}, ${DEFAULT_SETTINGS.notificationEnabled}, ${DEFAULT_SETTINGS.theme})
    `;

    const token = createId();
    await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${user.id})`;
    await setSessionCookie(token);

    return jsonResponse(
        { data: { id: user.id, name: user.name, email: user.email } },
        201,
    );
}
