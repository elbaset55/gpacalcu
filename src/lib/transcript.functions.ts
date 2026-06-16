import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/replit/auth";
import { generateText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway";
import { checkRateLimit } from "./rate-limit";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const inputSchema = z.object({
  fileDataUrl: z.string().min(50).max(15_000_000),
  mimeType: z
    .string()
    .max(80)
    .refine(
      (m) => ALLOWED_MIME_TYPES.has(m.split(";")[0].trim().toLowerCase()),
      { message: "Unsupported file type. Use PDF, JPEG, PNG, or WebP." },
    ),
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
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const rl = checkRateLimit(`transcript:${userId}`, 5, 60_000);
    if (!rl.allowed) {
      throw new Error(
        data.lang === "ar"
          ? `تجاوزت الحد المسموح. حاول بعد ${Math.ceil(rl.retryAfterMs / 1000)} ثانية.`
          : `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      );
    }

    const model = getAiModel("google/gemini-2.5-flash");

    const scaleName = data.scaleHint === "benha" ? "بنها 2021" : "4.0 جنرك";

    const benhaTable =
      data.scaleHint === "benha"
        ? `جدول التقديرات (لائحة بنها 2021):
أ+ / A+ = 4.00 (90-100%)
أ / A = 3.667 (85-89%)
ب+ / B+ = 3.333 (80-84%)
ب / B = 3.00 (75-79%)
ب- / B- = 2.667 (70-74%)
ج+ / C+ = 2.333 (65-69%)
ج / C = 2.00 (60-64%)
ر / F = 0.00 (راسب، أقل من 60%)`
        : `4.0 generic scale: A+=4.0, A=3.7, A-=3.3, B+=3.0, B=2.7, B-=2.3, C+=2.0, C=1.7, D=1.0, F=0.0`;

    void scaleName;

    const sys =
      data.lang === "ar"
        ? `أنت محلّل خبير لكشوف الدرجات الجامعية المصرية. اقرأ كل صفوف الجدول بدقة.
${benhaTable}

قواعد إلزامية:
1. استخرج كل مادة في الكشف بدون استثناء، حتى لو كانت في صفحات أو فصول مختلفة.
2. لكل مادة لازم تملأ التقدير: ابحث في كل الأعمدة (الحرف / النقاط / النسبة المئوية / كلمة "ناجح/راسب"). لو لقيت أي واحدة منهم املأ grade_letter و grade_pts و percentage معاً قدر الإمكان باستخدام الجدول أعلاه.
3. متسيبش grade فاضي إلا لو المادة فعلاً بدون أي تقدير في المستند (مثلاً "غير مكتمل" أو فارغة تماماً).
4. استخدم الحرف زي ما هو مكتوب في المستند في grade_letter، وحوّله لنقاط في grade_pts حسب الجدول.
5. حدّد semester_label لكل مادة (الفصل/الترم اللي ظهرت فيه).
6. لا تخترع مواد أو درجات غير موجودة.

أعِد JSON فقط (بدون أي شرح خارج الـ JSON) بهذا الشكل بالضبط:
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
}`
        : `You are an expert Egyptian university transcript analyzer. Read every table row carefully.
${benhaTable}

Mandatory rules:
1. Extract EVERY course in the transcript, even across multiple pages or terms.
2. Every course MUST have a resolved grade: scan ALL columns (letter / points / percentage / pass-fail word). If any of them is present, fill grade_letter, grade_pts AND percentage together as far as possible using the table above.
3. Only leave a grade empty if the course genuinely has no grade in the document (e.g. "incomplete" or fully blank).
4. Put the letter exactly as written in grade_letter, and convert it to grade_pts using the table.
5. Set semester_label for each course (the term it appears in).
6. Never invent courses or grades.

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
}`;

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
      throw new Error(
        data.lang === "ar"
          ? "رد التحليل اتقطع. جرّب PDF أصغر أو أوضح."
          : "Analysis response was truncated. Try a smaller or clearer PDF.",
      );
    }

    const parsed = extractJson(text);
    const result = outputSchema.parse(parsed);
    result.courses = result.courses.filter((c) => c.name && c.name.trim().length > 0);
    return result;
  });
