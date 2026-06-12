import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const inputSchema = z.object({
  // data URL: data:<mime>;base64,XXXX
  fileDataUrl: z.string().min(50).max(15_000_000),
  mimeType: z.string().max(80),
  scaleHint: z.enum(["benha", "generic"]).default("benha"),
  lang: z.enum(["ar", "en"]).default("ar"),
});

const looseNum = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return value;
  const normalized = value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "")
    .trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const courseSchema = z.object({
  name: z.coerce.string().default(""),
  code: z.coerce.string().optional(),
  credits: looseNum,
  grade_letter: z.coerce.string().optional(),
  grade_pts: looseNum,
  percentage: looseNum,
  semester_label: z.coerce.string().optional(),
});

const outputSchema = z.object({
  cumulative_gpa: looseNum.nullable(),
  total_credits_earned: looseNum.nullable(),
  current_level: looseNum.nullable(),
  university: z.coerce.string().nullable().optional(),
  major: z.coerce.string().nullable().optional(),
  courses: z.array(courseSchema).default([]),
  notes: z.string().optional(),
});

export type TranscriptResult = z.infer<typeof outputSchema>;

// Pull the first {...} JSON object out of a model response (handles ```json fences).
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function dataUrlToBase64(fileDataUrl: string, fallbackMime: string) {
  const match = fileDataUrl.match(/^data:([^;,]+)?;base64,(.*)$/s);
  if (!match) return { mediaType: fallbackMime || "application/pdf", base64: fileDataUrl };
  return { mediaType: match[1] || fallbackMime || "application/pdf", base64: match[2].replace(/\s/g, "") };
}

export const analyzeTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const scaleName = data.scaleHint === "benha" ? "بنها 2021" : "4.0 جنرك";

    const sys =
      data.lang === "ar"
        ? `أنت مساعد ذكي يقرأ كشوف الدرجات وبيانات الطالب الأكاديمية.
حلّل المستند المرفق واستخرج البيانات.
أعِد JSON فقط (بدون أي شرح أو نص خارج الـ JSON) بالشكل التالي بالضبط:
{
  "cumulative_gpa": رقم أو null,
  "total_credits_earned": رقم أو null,
  "current_level": رقم من 1 إلى 4 أو null,
  "university": نص أو null,
  "major": نص أو null,
  "courses": [
    { "name": "اسم المادة", "code": "كود أو حذفه", "credits": رقم, "grade_letter": "الحرف", "grade_pts": رقم من 4.0, "percentage": رقم, "semester_label": "اسم الفصل" }
  ],
  "notes": "ملاحظات قصيرة"
}
لو المستند بنظام 100% حوّل النسبة لنقاط حسب لائحة ${scaleName}.
اترك الحقول المجهولة null أو احذفها من المادة. لا تخترع بيانات.`
        : `You are an academic transcript parser. Analyze the attached document.
Return ONLY JSON (no prose outside the JSON) in exactly this shape:
{
  "cumulative_gpa": number or null,
  "total_credits_earned": number or null,
  "current_level": number 1-4 or null,
  "university": string or null,
  "major": string or null,
  "courses": [
    { "name": "course name", "code": "code or omit", "credits": number, "grade_letter": "letter", "grade_pts": number out of 4.0, "percentage": number, "semester_label": "term" }
  ],
  "notes": "short notes"
}
If grades are in % convert to ${scaleName} scale. Use null or omit unknown fields. Do not invent data.`;

    const file = dataUrlToBase64(data.fileDataUrl, data.mimeType);
    const { text, finishReason } = await generateText({
      model,
      temperature: 0,
      maxOutputTokens: 12000,
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                data.lang === "ar"
                  ? "حلّل كشف الدرجات المرفق وأعد JSON منظم فقط."
                  : "Analyze the attached transcript and return structured JSON only.",
            },
            {
              type: "file",
              data: file.base64,
              mediaType: file.mediaType,
              filename: file.mediaType === "application/pdf" ? "transcript.pdf" : "transcript-image",
            } as any,
          ],
        },
      ],
    });

    if (finishReason === "length") {
      throw new Error(data.lang === "ar" ? "رد التحليل اتقطع. جرّب PDF أصغر أو أوضح." : "Analysis response was truncated. Try a smaller or clearer PDF.");
    }

    const parsed = extractJson(text);
    // Lenient parse: coerce types, drop bad rows instead of failing the whole call.
    const result = outputSchema.parse(parsed);
    // Keep only courses with a usable name.
    result.courses = result.courses.filter((c) => c.name && c.name.trim().length > 0);
    return result;
  });
