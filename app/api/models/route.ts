import { z } from 'zod';

const bodySchema = z.object({
  key: z.string().min(1, 'Vui lòng cung cấp API Key để kiểm tra.'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const key = parsed.data.key.trim();
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const message = err?.error?.message || (r.status === 400 ? 'API Key không hợp lệ.' : 'Không thể kết nối đến Gemini.');
      return Response.json({ error: message }, { status: r.status === 400 ? 400 : 502 });
    }

    const data = (await r.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };

    const models = (data.models || [])
      .filter((m) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name!.replace(/^models\//, ''))
      .filter((name) => /^gemini-/.test(name) && !name.includes('vision') && !name.includes('embedding'));

    const priority = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
    models.sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    return Response.json({ models });
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.' }, { status: 500 });
  }
}
