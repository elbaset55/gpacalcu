import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const inputSchema = z.object({
  // data URL: data:<mime>;base64,XXXX
  fileDataUrl: z.string().min(50).max(15_000_000),
  mimeType: z.string().max(80),
  scaleHint: z.enum(["benha", "generic"]).default("benha"),
  lang: z.enum(["ar", "en"]).default("ar"),
});

const courseSchema = z.object({
  name: z.string().describe("اسم المادة"),
  code: z.string().optional().describe("كود المادة إن وجد"),
  credits: z.number().int().min(0).max(12).describe("عدد الساعات المعتمدة"),
  grade_letter: z.string().optional().describe("التقدير بالحروف مثل A+, B, ج"),
  grade_pts: z.number().min(0).max(4).optional().describe("النقاط من 4.0"),
  percentage: z.number().min(0).max(100).optional(),
  semester_label: z.string().optional().describe("اسم/رقم الفصل لو ظاهر"),
});

const outputSchema = z.object({
  cumulative_gpa: z.number().min(0).max(4).nullable().describe("المعدل التراكمي إن وُجد"),
  total_credits_earned: z.number().int().min(0).max(400).nullable(),
  current_level: z.number().int().min(1).max(6).nullable().describe("السنة/المستوى الدراسي 1..4"),
  university: z.string().nullable(),
  major: z.string().nullable(),
  courses: z.array(courseSchema).max(120),
  notes: z.string().max(600).optional(),
});

export const analyzeTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-pro");

    const sys =
      data.lang === "ar"
        ? `أنت مساعد ذكي يقرأ كشوف الدرجات وبيانات الطالب الأكاديمية. حلّل المستند المرفق واستخرج:
- المعدل التراكمي (GPA من 4.0).
- إجمالي الساعات المكتسبة.
- المستوى/السنة الدراسية الحالية (1=أولى، 2=ثانية، 3=ثالثة، 4=رابعة).
- اسم الجامعة والكلية والتخصص.
- قائمة المواد بأسمائها وأكوادها وعدد ساعاتها وتقديراتها (حرف ونقاط من 4.0).
- لو المستند بنظام 100% حوّل النسبة لنقاط حسب اللائحة (${data.scaleHint === "benha" ? "بنها 2021" : "4.0 جنرك"}).
أعد فقط الحقول التي تأكدت منها، واترك غيرها null. لا تخترع بيانات.`
        : `You are an academic transcript parser. Extract cumulative GPA (out of 4.0), total earned credits, current academic year (1-4), university, major, and the full list of courses (name, code, credits, letter grade, points out of 4.0). If grades are in % convert to ${data.scaleHint === "benha" ? "Benha 2021" : "generic 4.0"} scale. Return null for unknown fields. Do not invent data.`;

    const { experimental_output: output } = await generateText({
      model,
      experimental_output: Output.object({ schema: outputSchema }),
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                data.lang === "ar"
                  ? "حلّل كشف الدرجات المرفق وأعد JSON منظم."
                  : "Analyze the attached transcript and return structured JSON.",
            },
            {
              type: "file",
              data: data.fileDataUrl,
              mediaType: data.mimeType,
            } as any,
          ],
        },
      ],
    });

    return output;
  });
