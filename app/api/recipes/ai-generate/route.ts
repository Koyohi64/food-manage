import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { sql } from "@/lib/db";
import {
    errorResponse,
    isUuid,
    readJsonBody,
    requireUser,
} from "../../_lib/http";
import { rowToIngredient } from "../../_lib/store";
import { MultipleRecipesSchema } from "../../_lib/schemas";

type AiGenerateBody = {
    ingredientIds?: unknown;
    preferences?: unknown;
    servings?: unknown;
    dishCount?: unknown;
    strictIngredients?: unknown;
};

export async function POST(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    if (!process.env.GEMINI_API_KEY) {
        return errorResponse(500, "INTERNAL_ERROR", "AI service is not configured.");
    }
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.value as AiGenerateBody;

    if (!Array.isArray(body.ingredientIds) || body.ingredientIds.length < 1) {
        return errorResponse(400, "VALIDATION_ERROR", "ingredientIds is required.");
    }
    const ingredientIds = body.ingredientIds as unknown[];
    if (ingredientIds.some((id) => !isUuid(id))) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid ingredientIds.");
    }

    const preferences =
        body.preferences == null
            ? null
            : typeof body.preferences === "string" && body.preferences.length <= 500
                ? body.preferences
                : null;
    if (body.preferences != null && preferences === null) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid preferences.");
    }

    const servings =
        body.servings == null
            ? 2
            : typeof body.servings === "number" && Number.isInteger(body.servings) && body.servings >= 1
                ? body.servings
                : null;
    if (servings === null) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid servings.");
    }

    const dishCount =
        body.dishCount == null
            ? 1
            : typeof body.dishCount === "number" && Number.isInteger(body.dishCount) && body.dishCount >= 1 && body.dishCount <= 5
                ? body.dishCount
                : null;
    if (dishCount === null) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid dishCount.");
    }

    const strictIngredients = body.strictIngredients === false ? false : true;

    const rows = await sql`SELECT * FROM ingredients WHERE user_id = ${auth.user.id}`;
    const allIngredients = rows.map((r) => rowToIngredient(r as Record<string, unknown>));
    const matchedIngredients = ingredientIds.map((id) =>
        allIngredients.find((ing) => ing.id === id)
    );
    if (matchedIngredients.some((ing) => !ing)) {
        return errorResponse(403, "FORBIDDEN", "Invalid ingredientIds.");
    }

    const ingredientList = matchedIngredients
        .map((ing) => {
            const qty = ing!.quantity !== null ? `${ing!.quantity}${ing!.unit ?? ""}` : "";
            return qty ? `${ing!.name}（${qty}）` : ing!.name;
        })
        .join("、");

    const strictNote = strictIngredients
        ? "選択した食材のみを使ってください。他の食材は使わないでください。"
        : "選択した食材を中心に使いつつ、必要に応じて他の一般的な食材（調味料・野菜など）も自由に追加してください。";

    const dishNote = dishCount > 1
        ? `\n${dishCount}品の献立を作成してください。メイン料理1品と副菜${dishCount - 1}品をそれぞれ独立したレシピとして考えてください。`
        : "\n1品のレシピを作成してください。";

    const preferenceText = preferences ? `\n追加条件: ${preferences}` : "";

    const prompt = `以下の食材を使った${servings}人分の日本語レシピを考えてください。
${strictNote}
食材: ${ingredientList}${dishNote}${preferenceText}
レシピは家庭料理として現実的なものにしてください。手順は具体的かつ簡潔に書いてください。`;

    try {
        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: MultipleRecipesSchema,
            prompt,
        });

        const encoder = new TextEncoder();
        const payload = `data: ${JSON.stringify(object)}\n\n`;
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(payload));
                controller.close();
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (err) {
        console.error("AI generate error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        return errorResponse(500, "INTERNAL_ERROR", `AI generation failed: ${msg}`);
    }
}
