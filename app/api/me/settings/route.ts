import { sql } from "@/lib/db";
import {
    DEFAULT_SETTINGS,
    type StoredUserSettings,
    type Theme,
} from "../../_lib/store";
import {
    errorResponse,
    jsonResponse,
    readJsonBody,
    requireUser,
} from "../../_lib/http";

type SettingsBody = {
    warningDay?: unknown;
    notificationEnabled?: unknown;
    theme?: unknown;
};

function isTheme(value: unknown): value is Theme {
    return value === "light" || value === "dark" || value === "system";
}

export async function GET(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) {
        return auth.response;
    }

    const rows = await sql`
        SELECT warning_day, notification_enabled, theme
        FROM user_settings
        WHERE user_id = ${auth.user.id}
        LIMIT 1
    `;
    if (rows.length === 0) {
        return jsonResponse({ data: DEFAULT_SETTINGS });
    }
    const row = rows[0];
    return jsonResponse({
        data: {
            warningDay: row.warning_day as number,
            notificationEnabled: row.notification_enabled as boolean,
            theme: row.theme as Theme,
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
    const body = bodyResult.value as SettingsBody;

    const updates: Partial<StoredUserSettings> = {};

    if (body.warningDay !== undefined) {
        if (
            typeof body.warningDay !== "number" ||
            !Number.isInteger(body.warningDay) ||
            body.warningDay < 0 ||
            body.warningDay > 14
        ) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid warningDay.");
        }
        updates.warningDay = body.warningDay;
    }

    if (body.notificationEnabled !== undefined) {
        if (typeof body.notificationEnabled !== "boolean") {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid notificationEnabled.");
        }
        updates.notificationEnabled = body.notificationEnabled;
    }

    if (body.theme !== undefined) {
        if (!isTheme(body.theme)) {
            return errorResponse(400, "VALIDATION_ERROR", "Invalid theme.");
        }
        updates.theme = body.theme;
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(400, "VALIDATION_ERROR", "No settings to update.");
    }

    const currentRows = await sql`
        SELECT warning_day, notification_enabled, theme
        FROM user_settings WHERE user_id = ${auth.user.id} LIMIT 1
    `;
    const current: StoredUserSettings = currentRows.length > 0
        ? {
            warningDay: currentRows[0].warning_day as number,
            notificationEnabled: currentRows[0].notification_enabled as boolean,
            theme: currentRows[0].theme as Theme,
        }
        : { ...DEFAULT_SETTINGS };

    const next = { ...current, ...updates };

    await sql`
        INSERT INTO user_settings (user_id, warning_day, notification_enabled, theme)
        VALUES (${auth.user.id}, ${next.warningDay}, ${next.notificationEnabled}, ${next.theme})
        ON CONFLICT (user_id) DO UPDATE
        SET warning_day = EXCLUDED.warning_day,
            notification_enabled = EXCLUDED.notification_enabled,
            theme = EXCLUDED.theme,
            updated_at = NOW()
    `;

    return jsonResponse({ data: next });
}
