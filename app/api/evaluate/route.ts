import { z } from "zod";
import {
  executeWithCascadeFallback,
  buildDynamicWaterfall,
} from "@/lib/gemini-resilience-gateway";

export const maxDuration = 120;

const evalSchema = z.object({
  key: z.string().optional(),
  model: z.string().optional(),
  documentText: z.string().min(50, "Nội dung cần thẩm định phải có ít nhất 50 ký tự."),
  title: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = evalSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    const { key, model, documentText, title, subject, grade } = parsed.data;

    const candidates = buildDynamicWaterfall(model);
    const envKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
      .split(/[,;\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    const apiKeys = [key?.trim() || "", ...envKeys].filter(Boolean);

    if (!apiKeys.length) {
      return Response.json(
        { error: "Vui lòng nhập Gemini API Key trong Cấu hình AI để thẩm định đề tài." },
        { status: 401 }
      );
    }

    const systemInstruction = `Bạn là Chủ tịch Hội đồng Thẩm định Sáng kiến Kinh nghiệm (SKKN) Ngành Giáo dục tại Việt Nam, am hiểu sâu sắc Nghị định 13/2012/NĐ-CP và Chương trình GDPT 2018.
Nhiệm vụ của bạn là chấm điểm và phản biện bài viết SKKN của giáo viên theo đúng Barem 100 điểm của Bộ Giáo dục & Đào tạo:
- Tiêu chí 1: Tính mới & Sáng tạo (Tối đa 30 điểm).
- Tiêu chí 2: Tính khoa học & Sư phạm (Tối đa 30 điểm).
- Tiêu chí 3: Tính hiệu quả & Thực nghiệm (Tối đa 25 điểm).
- Tiêu chí 4: Khả năng nhân rộng & Ứng dụng (Tối đa 15 điểm).

Quy chuẩn nhận xét bắt buộc: Tuân thủ cấu trúc Bánh kẹp sư phạm (Sandwich Feedback):
- Lớp 1 (Ghi nhận ưu điểm): Khen ngợi tâm huyết, những ý tưởng sáng tạo và điểm mạnh của đề tài.
- Lớp 2 (Chỉ ra điểm cần hoàn thiện): Phân tích chi tiết các thiếu sót (ví dụ thiếu số liệu đối chứng, thiếu lớp đối chứng song song, giải pháp chưa rõ quy trình các bước) và BẮT BUỘC cung cấp một 'rewrittenSample' (đoạn văn mẫu viết lại chuyên sâu để Thầy/Cô có thể đưa ngay vào bản sửa đổi).
- Lớp 3 (Động viên & Khẳng định tiềm năng): Động viên tinh thần và đánh giá triển vọng đạt giải cao khi hoàn thiện các góp ý.

Định dạng trả về duy nhất là JSON object không kèm markdown bọc ngoài:
{
  "totalScore": number,
  "ranking": "Xuất sắc" | "Khá" | "Đạt" | "Chưa đạt",
  "tierColor": string (hex code: "#16a34a" cho Xuất sắc, "#2563eb" cho Khá, "#d97706" cho Đạt, "#dc2626" cho Chưa đạt),
  "summary": string,
  "criteria": [
    { "id": 1, "name": "Tính mới & Sáng tạo", "score": number, "maxScore": 30, "strengths": string, "weaknesses": string },
    { "id": 2, "name": "Tính khoa học & Sư phạm", "score": number, "maxScore": 30, "strengths": string, "weaknesses": string },
    { "id": 3, "name": "Tính hiệu quả & Thực nghiệm", "score": number, "maxScore": 25, "strengths": string, "weaknesses": string },
    { "id": 4, "name": "Khả năng nhân rộng", "score": number, "maxScore": 15, "strengths": string, "weaknesses": string }
  ],
  "sandwichFeedback": {
    "praise": string,
    "critique": string,
    "rewrittenSample": string,
    "encouragement": string
  },
  "actionableRecommendations": string[]
}`;

    const promptText = `HÃY THẨM ĐỊNH ĐỀ TÀI SÁNG KIẾN KINH NGHIỆM DƯỚI ĐÂY:
${title ? `- Tên đề tài: ${title}` : ""}
${subject ? `- Môn học: ${subject}` : ""}
${grade ? `- Cấp học/Khối lớp: ${grade}` : ""}

NỘI DUNG TOÀN VĂN ĐỀ TÀI CẦN THẨM ĐỊNH:
"""
${documentText.slice(0, 30000)}
"""

Hãy đánh giá khách quan, chấm điểm công tâm theo barem 100 điểm và trả JSON duy nhất.`;

    const execution = await executeWithCascadeFallback(
      async (modelId, apiKey, signal) => {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 8192,
                temperature: 0.2,
              },
            }),
            signal,
          }
        );

        if (!r.ok) {
          const errBody = await r.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || `Lỗi Gemini API (HTTP ${r.status})`;
          const err = new Error(errMsg) as Error & { status?: number };
          err.status = r.status;
          throw err;
        }

        const resData = (await r.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const raw =
          resData.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

        if (!raw) throw new Error("Mô hình không trả về kết quả thẩm định.");

        const cleanJson = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        return JSON.parse(cleanJson);
      },
      {
        candidates,
        apiKeys,
        maxRetriesPerModel: 1,
        totalDeadlineMs: 110000,
        onFallback: ({ fromModel, toModel, reason }) => {
          console.warn(`[Evaluate Gateway] Chuyển từ ${fromModel} ➔ ${toModel}: ${reason}`);
        },
      }
    );

    return Response.json(
      {
        ...execution.data,
        usedModel: execution.usedModel,
        fallbacks: execution.fallbacks,
        durationMs: execution.durationMs,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "x-gemini-model-used": execution.usedModel,
        },
      }
    );
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    return Response.json(
      { error: error.message || "Không thể thực hiện thẩm định đề tài." },
      { status: 500 }
    );
  }
}
