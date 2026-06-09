import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
    SESSION_COOKIE_NAME,
    rowToUser,
    type StoredUser,
} from "./store";

type ErrorCode =
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "INVALID_TOKEN"
    | "EXPIRED"
    | "INSUFFICIENT_STOCK"
    | "INTERNAL_ERROR";

export function errorResponse(
    status: number,
    code: ErrorCode,
    message: string,
): Response {
    return Response.json({ error: { code, message } }, { status });
}

export function jsonResponse(
    payload: Record<string, unknown>,
    status = 200,
    headers?: HeadersInit,
): Response {
    return Response.json(payload, { status, headers });
}

export function noContentResponse(headers?: HeadersInit): Response {
    return new Response(null, { status: 204, headers });
}

export async function readJsonBody(
    request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return {
            ok: false,
            response: errorResponse(400, "VALIDATION_ERROR", "Invalid content type."),
        };
    }

    const bodyText = await request.text();
    if (!bodyText) {
        return {
            ok: false,
            response: errorResponse(400, "VALIDATION_ERROR", "Request body is required."),
        };
    }

    try {
        return { ok: true, value: JSON.parse(bodyText) };
    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                ok: false,
                response: errorResponse(400, "VALIDATION_ERROR", "Invalid JSON payload."),
            };
        }
        throw error;
    }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
    const result: Record<string, string> = {};
    if (!cookieHeader) {
        return result;
    }

    for (const part of cookieHeader.split(";")) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }
        const [name, ...valueParts] = trimmed.split("=");
        if (!name) {
            continue;
        }
        result[name] = decodeURIComponent(valueParts.join("="));
    }

    return result;
}

export async function getSessionToken(_request?: Request): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getUserFromSession(request?: Request): Promise<StoredUser | null> {
    const token = await getSessionToken(request);
    if (!token) {
        return null;
    }
    const rows = await sql`
        SELECT u.id, u.name, u.email, u.password, u.created_at, u.updated_at
        FROM users u
        JOIN sessions s ON s.user_id = u.id
        WHERE s.token = ${token}
        LIMIT 1
    `;
    if (rows.length === 0) {
        return null;
    }
    return rowToUser(rows[0] as Record<string, unknown>);
}

export async function requireUser(
    request?: Request,
): Promise<{ user: StoredUser } | { response: Response }> {
    const user = await getUserFromSession(request);
    if (!user) {
        return { response: errorResponse(401, "UNAUTHORIZED", "Unauthorized.") };
    }
    return { user };
}

export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export function sessionCookieHeader(token: string): string {
    return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearSessionCookieHeader(): string {
    return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isUuid(value: unknown): value is string {
    return (
        typeof value === "string" &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            value,
        )
    );
}

export function isEmail(value: unknown): value is string {
    return (
        typeof value === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );
}

export function isDateString(value: unknown): value is string {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function clampInt(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function parseOptionalInt(value: string | null): number | null {
    if (value === null) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function parsePagination(
    url: URL,
    defaultLimit: number,
): { page: number; limit: number } | { response: Response } {
    const pageRaw = url.searchParams.get("page");
    const limitRaw = url.searchParams.get("limit");
    const page = parseOptionalInt(pageRaw);
    const limit = parseOptionalInt(limitRaw);

    if (pageRaw !== null && (page === null || page < 1)) {
        return {
            response: errorResponse(400, "VALIDATION_ERROR", "Invalid page value."),
        };
    }
    if (limitRaw !== null && (limit === null || limit < 1 || limit > 100)) {
        return {
            response: errorResponse(400, "VALIDATION_ERROR", "Invalid limit value."),
        };
    }

    return {
        page: page ?? 1,
        limit: limit ?? defaultLimit,
    };
}

export function paginate<T>(
    items: T[],
    page: number,
    limit: number,
): { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}
