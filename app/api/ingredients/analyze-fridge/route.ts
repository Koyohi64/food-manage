import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
    errorResponse,
    jsonResponse,
    requireUser,
} from "../../_lib/http";
import { AnalyzedIngredientsSchema } from "../../_lib/schemas";

const MAX_IMAGE_BYTES = 5_000_000;

export async function POST(request: Request): Promise<Response> {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    if (!process.env.GEMINI_API_KEY) {
        return errorResponse(500, "INTERNAL_ERROR", "AI service is not configured.");
    }
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof Blob)) {
        return errorResponse(400, "VALIDATION_ERROR", "Image file is required.");
    }
    if (image.size > MAX_IMAGE_BYTES) {
        return errorResponse(413, "VALIDATION_ERROR", "Image too large.");
    }

    const arrayBuffer = await image.arrayBuffer();

    try {
        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: AnalyzedIngredientsSchema,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `この冷蔵庫・冷凍庫・野菜室の画像から見えている食材を全て検出してください。
食材名は一般的な名称で記入してください（例: 「有機ほうれん草」→「ほうれん草」）。
数量は目視で推測できる場合のみ記入してください（例: 「2本」「1袋」など）。
鮮度・傷み具合から残り賞味期限を推測してください。
estimatedExpiryDateはYYYY-MM-DD形式で今日から算出してください。今日は${new Date().toISOString().slice(0, 10)}です。
confidence は食材検出の確信度を 0〜1 で記入してください（はっきり見える=1.0、ぼんやり見える=0.5など）。
見切れていたり不明瞭な食材も可能な範囲で推測して含めてください。`,
                        },
                        {
                            type: "image",
                            image: arrayBuffer,
                        },
                    ],
                },
            ],
        });

        return jsonResponse({ data: object });
    } catch (err) {
        console.error("Fridge analysis error:", err);
        return errorResponse(500, "INTERNAL_ERROR", "Image analysis failed.");
    }
}
