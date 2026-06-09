import { sql } from "@/lib/db";
import {
    clearSessionCookie,
    getSessionToken,
    noContentResponse,
} from "../../_lib/http";

export async function POST(): Promise<Response> {
    const token = await getSessionToken();
    if (token) {
        await sql`DELETE FROM sessions WHERE token = ${token}`;
    }
    await clearSessionCookie();
    return noContentResponse();
}
