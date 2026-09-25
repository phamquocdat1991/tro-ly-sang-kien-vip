import { z } from "zod";
import mammoth from "mammoth";
import {
  executeWithCascadeFallback,
  buildDynamicWaterfall,
} from "@/lib/gemini-resilience-gateway";

export const maxDuration = 120;

const inputSchema = z.object({
  key: z.string().optional(),
  model: z.string().optional(),
  action: z.enum(["full", "section", "rewrite"]).default("full"),
  sectionIndex: z.coerce.number().min(0).max(5).default(0),
  revision: z.string().optional(),
  existingContent: z.string().optional(),
  author: z.string().default(""),
  school: z.string().default(""),
  subject: z.string().default(""),
  level: z.string().default(""),
  grade: z.string().default(""),
  title: z.string().min(1, "Vui lòng nhập tên đề tài sáng kiến."),
  focus: z.string().default(""),
  audience: z.string().default(""),
  region: z.string().default(""),
  year: z.string().default(""),
  textbook: z.string().default(""),
  duration: z.string().default(""),
  facilities: z.string().default(""),
  technology: z.string().default(""),
  novelty: z.string().default(""),
  solutionCount: z.coerce.number().min(1).max(8).default(3),
  pageTarget: z.string().default(""),
  realExamples: z.coerce.boolean().default(true),
  statistics: z.coerce.boolean().default(true),
  notes: z.string().default(""),
  referenceNotes: z.string().default(""),
});

const SECTION_TITLES = [
  "PHẦN I: ĐẶT VẤN ĐỀ (MỞ ĐẦU)",
  "PHẦN II: CƠ SỞ LÝ LUẬN VÀ THỰC TRẠNG",
  "PHẦN III: CÁC BIỆN PHÁP GIẢI QUYẾT VẤN ĐỀ",
  "PHẦN IV: HIỆU QUẢ THỰC NGHIỆM VÀ KẾT QUẢ ĐẠT ĐƯỢC",
  "PHẦN V: KẾT LUẬN VÀ KIẾN NGHỊ",
  "PHẦN VI: PHỤ LỤC VÀ TÀI LIỆU THAM KHẢO",
];

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let data: z.infer<typeof inputSchema>;
    const filesText: string[] = [];
    const inlineImages: { mimeType: string; data: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const raw: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") raw[key] = value;
      });
      const parsed = inputSchema.safeParse(raw);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
          { status: 400 }
        );
      }
      data = parsed.data;

      // Xử lý tệp đính kèm
      const files = formData
        .getAll("files")
        .filter((x): x is File => typeof x !== "string");
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (ext === "docx" || ext === "doc") {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const res = await mammoth.extractRawText({ buffer });
            const text = (res.value || "").trim();
            if (text) {
              filesText.push(`[Trích xuất từ tệp Word: ${file.name}]:\n${text.slice(0, 15000)}`);
            }
          } catch {
            console.warn(`Không đọc được file docx: ${file.name}`);
          }
        } else if (ext === "txt") {
          const content = await file.text();
          if (content) {
            filesText.push(`[Trích xuất từ tệp TXT: ${file.name}]:\n${content.slice(0, 10000)}`);
          }
        } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          inlineImages.push({
            mimeType: `image/${ext === "jpg" ? "jpeg" : ext}`,
            data: btoa(binary),
          });
        }
      }
    } else {
      const json = await req.json();
      const parsed = inputSchema.safeParse(json);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
          { status: 400 }
        );
      }
      data = parsed.data;
    }

    const systemInstruction = `Bạn là Chuyên gia Cao cấp về Thẩm định Sáng kiến Kinh nghiệm (SKKN) và Phương pháp Dạy học theo Chương trình GDPT 2018 tại Việt Nam.
Nhiệm vụ của bạn là xây dựng nội dung sáng kiến kinh nghiệm có chiều sâu sư phạm, mạch lạc, thực tế, bám sát Nghị định 13/2012/NĐ-CP và barem chấm điểm của ngành giáo dục:
1. Đảm bảo cấu trúc 4 thành tố cốt lõi: Biện pháp thực hiện, Đối tượng tác động, Phạm vi áp dụng và Mục tiêu phát triển năng lực/phẩm chất.
2. Văn phong chuẩn mực sư phạm, xưng hô 'giáo viên' hoặc ngôi thứ ba khách quan, dùng thuật ngữ GDPT 2018 chuẩn xác (yêu cầu cần đạt, năng lực tự chủ tự học, giải quyết vấn đề, giao tiếp hợp tác...).
3. Phần các giải pháp phải cụ thể, có ví dụ minh họa hoặc quy trình các bước rõ ràng (Bước 1, Bước 2, Bước 3) thay vì chỉ nêu lý thuyết chung chung.
4. Phần kết quả thực nghiệm phải có bảng số liệu khảo sát đối chứng (trước và sau thực nghiệm, tỷ lệ % học sinh đạt các mức) một cách chân thực, logic.`;

    const profileContext = `THÔNG TIN HỒ SƠ SÁNG KIẾN:
- Tên đề tài: ${data.title}
- Tác giả: ${data.author || "Giáo viên"}
- Đơn vị: ${data.school || "Trường học"}
- Môn học / Lĩnh vực: ${data.subject}
- Cấp học: ${data.level} - Khối lớp: ${data.grade}
- Trọng tâm giải quyết: ${data.focus}
- Đối tượng nghiên cứu: ${data.audience}
- Địa bàn áp dụng: ${data.region}
- Năm học: ${data.year}
- Bộ sách giáo khoa: ${data.textbook}
- Thời gian thực hiện: ${data.duration}
- Điều kiện cơ sở vật chất: ${data.facilities}
- Công nghệ / Công cụ áp dụng: ${data.technology}
- Điểm mới / Khác biệt: ${data.novelty}
- Số lượng giải pháp trọng tâm yêu cầu: ${data.solutionCount} giải pháp
- Yêu cầu kèm ví dụ minh họa: ${data.realExamples ? "Có ví dụ cụ thể trong môn học" : "Không bắt buộc"}
- Yêu cầu bảng số liệu khảo nghiệm: ${data.statistics ? "Bắt buộc có bảng thống kê đối chứng" : "Không bắt buộc"}
${data.notes ? `- Ghi chú thêm của tác giả: ${data.notes}` : ""}
${filesText.length ? `\nTÀI LIỆU ĐÍNH KÈM THAM KHẢO:\n${filesText.join("\n\n")}` : ""}`;

    const candidates = buildDynamicWaterfall(data.model);
    const envKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
      .split(/[,;\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    const apiKeys = [data.key?.trim() || "", ...envKeys].filter(Boolean);

    if (!apiKeys.length) {
      return Response.json(
        { error: "Vui lòng nhập Gemini API Key trong Cấu hình AI để tạo nội dung." },
        { status: 401 }
      );
    }

    const execution = await executeWithCascadeFallback(
      async (modelId, apiKey, signal) => {
        let promptText = "";
        let responseSchemaJson = false;

        if (data.action === "full") {
          responseSchemaJson = true;
          promptText = `${profileContext}

YÊU CẦU: Hãy soạn thảo TOÀN BỘ 6 PHẦN của đề tài sáng kiến kinh nghiệm trên.
Định dạng trả về duy nhất là JSON object có trường "sections" là mảng gồm chính xác 6 chuỗi văn bản Markdown tương ứng với 6 phần:
- Phần 0: Mở đầu / Đặt vấn đề (Lý do chọn đề tài, Mục đích, Đối tượng, Phạm vi, Phương pháp).
- Phần 1: Cơ sở lý luận và Thực trạng (Cơ sở khoa học, Thực trạng ban đầu kèm số liệu khảo sát cụ thể).
- Phần 2: Các biện pháp giải quyết vấn đề (Trình bày chi tiết ${data.solutionCount} biện pháp, mỗi biện pháp có mục tiêu, quy trình thực hiện các bước và ví dụ minh họa cụ thể).
- Phần 3: Hiệu quả thực nghiệm (Bảng số liệu đối chứng trước và sau khi áp dụng, phân tích sự chuyển biến phẩm chất, năng lực của học sinh).
- Phần 4: Kết luận và Kiến nghị (Khẳng định tính hiệu quả, bài học kinh nghiệm, đề xuất với BGH, Phòng/Sở GD&ĐT).
- Phần 5: Phụ lục và Tài liệu tham khảo (Danh mục tài liệu tham khảo theo quy chuẩn trích dẫn, phụ lục biểu mẫu/phiếu học tập).

Trả về cú pháp JSON duy nhất: {"sections": ["# I...", "# II...", "# III...", "# IV...", "# V...", "# VI..."]}`;
        } else if (data.action === "section") {
          const targetTitle = SECTION_TITLES[data.sectionIndex];
          promptText = `${profileContext}

YÊU CẦU: Hãy soạn thảo CHUYÊN SÂU cho riêng: ${targetTitle}.
Viết chi tiết, đầy đủ đề mục, lập luận chặt chẽ, văn phong sư phạm trang trọng, bám sát các thông tin hồ sơ đã cung cấp.
Bắt đầu bằng tiêu đề cấp 1: # ${targetTitle}`;
        } else {
          // rewrite
          const targetTitle = SECTION_TITLES[data.sectionIndex];
          promptText = `${profileContext}

NỘI DUNG HIỆN TẠI CỦA ${targetTitle}:
"""
${data.existingContent}
"""

YÊU CẦU CHỈNH SỬA / VIẾT LẠI:
${data.revision || "Hãy nâng cấp văn phong sư phạm, bổ sung lập luận và làm sâu sắc thêm các giải pháp và số liệu đối chứng."}

Hãy viết lại hoàn thiện phần này, giữ nguyên cấu trúc Markdown chuẩn.`;
        }

        const parts: unknown[] = [{ text: promptText }];
        for (const img of inlineImages) {
          parts.push({ inlineData: img });
        }

        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: "user", parts }],
              generationConfig: {
                responseMimeType: responseSchemaJson ? "application/json" : "text/plain",
                maxOutputTokens: 8192,
                temperature: 0.35,
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
          candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
        };
        const candidate = resData.candidates?.[0];
        const raw =
          candidate?.content?.parts?.map((p) => p.text || "").join("") || "";

        if (!raw) {
          const err = new Error("Mô hình không trả về nội dung.");
          throw err;
        }

        if (data.action === "full") {
          try {
            const cleanJson = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
            const parsedObj = JSON.parse(cleanJson);
            if (Array.isArray(parsedObj.sections) && parsedObj.sections.length >= 6) {
              return { sections: parsedObj.sections.slice(0, 6) };
            }
          } catch {
            // fallback: nếu không parse được JSON 6 phần, tách theo heading #
            const parts = raw.split(/\n(?=# [I|V|X]+)/g).map((s) => s.trim()).filter(Boolean);
            if (parts.length >= 4) {
              return { sections: parts.slice(0, 6) };
            }
            throw new Error("Không phân tách được 6 phần từ phản hồi của AI. Đang thử lại...");
          }
        }

        return { content: raw };
      },
      {
        candidates,
        apiKeys,
        maxRetriesPerModel: 1,
        totalDeadlineMs: 110000,
        onFallback: ({ fromModel, toModel, reason, elapsedMs }) => {
          console.warn(
            `[Gemini Gateway] [${elapsedMs}ms] Tự chuyển từ ${fromModel} ➔ ${toModel}. Lý do: ${reason}`
          );
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
    const status = error.status === 401 || error.status === 403 ? 401 : error.status === 429 ? 429 : 500;
    return Response.json(
      { error: error.message || "Không thể khởi tạo nội dung sáng kiến." },
      { status }
    );
  }
}
