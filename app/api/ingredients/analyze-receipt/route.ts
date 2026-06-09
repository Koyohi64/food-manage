import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { errorResponse, requireUser } from "../../_lib/http";
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

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: unknown) => {
                controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            try {
                // Step 1: レシートからテキストを抽出（OCR）
                const { text: rawText } = await generateText({
                    model: google("gemini-2.5-flash"),
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "このレシートの画像に書かれているテキストをすべて正確に読み取って書き出してください。改行や空白もできる限り再現してください。",
                                },
                                {
                                    type: "image",
                                    image: arrayBuffer,
                                },
                            ],
                        },
                    ],
                });

                send({ type: "text", rawText });

                // Step 2: 抽出したテキストから食材を識別
                const { object } = await generateObject({
                    model: google("gemini-2.5-flash"),
                    schema: AnalyzedIngredientsSchema,
                    messages: [
                        {
                            role: "user",
                            content: `以下のレシートのテキストから食材のみを抽出してください。
店舗名・住所・電話番号・合計金額・税・ポイント・日付などは除外してください。
食材名は一般的な名称に変換してください（例: 「国産鶏もも肉」→「鶏もも肉」）。
数量と単位が読み取れる場合は記入してください。
賞味期限はレシートに記載されていないため、食材の種類から一般的な目安を推測してください。
estimatedExpiryDateはYYYY-MM-DD形式で今日から算出してください。今日は${new Date().toISOString().slice(0, 10)}です。

レシートのテキスト:
${rawText}`,
                        },
                    ],
                });

                send({ type: "ingredients", ingredients: object.ingredients });
            } catch (err) {
                console.error("Receipt analysis error:", err);
                send({ type: "error", message: "解析に失敗しました" });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
