import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway";
import { checkRateLimit } from "./rate-limit";

const courseSchema = z.object({
  code: z.string().max(40),
  name: z.string().max(120),
  credits: z.number().int().min(0).max(12),
  type: z.enum(["compulsory", "elective", "free", "retake", "future"]),
});

const input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  programName: z.string().max(200),
  level: z.number().int().min(1).max(4),
  semester: z.union([z.literal(1), z.literal(2), z.literal("summer" as const)]),
  selectedCourses: z.array(courseSchema).max(20),
  totalCredits: z.number().int().min(0).max(30),
  maxCredits: z.number().int().min(0).max(30),
  cumGpa: z.number().min(0).max(4),
  earnedCr: z.number().int().min(0).max(500),
  predictedGpa: z.number().min(0).max(4),
});

export const reviewWizardPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => input.parse(i))
  .handler(async function* ({ data, context }) {
    const { userId } = context;
    const rl = checkRateLimit(`wizardReview:${userId}`, 12, 60_000);
    if (!rl.allowed) {
      yield {
        delta:
          data.lang === "ar"
            ? `⚠️ تجاوزت الحد المسموح. حاول بعد ${Math.ceil(rl.retryAfterMs / 1000)} ثانية.`
            : `⚠️ Rate limit. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      };
      return;
    }

    const model = getAiModel("google/gemini-2.5-flash");
    const ar = data.lang === "ar";
    const semStr =
      data.semester === "summer"
        ? ar ? "الفصل الصيفي" : "Summer Semester"
        : ar
          ? `الفصل ${data.semester}`
          : `Semester ${data.semester}`;

    const courseLines = data.selectedCourses
      .map((c) => `• ${c.code || "—"} — ${c.name} (${c.credits} cr · ${ar ? { compulsory: "إلزامي", elective: "اختياري", free: "حر", retake: "إعادة", future: "مستقبلي" }[c.type] : c.type})`)
      .join("\n");

    const prompt = ar
      ? `أنت مستشار أكاديمي ذكي وودود لطالب في جامعة بنها — كلية العلوم لائحة 2021.
قدّم مراجعة فورية وحماسية ومختصرة (150 كلمة) لخطة التسجيل التالية:

📚 البرنامج: ${data.programName}
📅 المستوى ${data.level} · ${semStr}
📊 المعدل التراكمي: ${data.cumGpa.toFixed(2)} | الساعات المكتسبة: ${data.earnedCr}
⏱️ الساعات المختارة: ${data.totalCredits} / ${data.maxCredits} (الحد الأقصى)
🎯 المعدل المتوقع: ${data.predictedGpa.toFixed(2)}

المقررات المختارة:
${courseLines}

اكتب بالعربية العامية الودودة. ابدأ مباشرةً بتقييم الخطة. أشر إلى نقاط قوة محددة، أي تحذيرات عن الشروط السابقة أو الحمل الدراسي، وتوقعاتك للمعدل. استخدم رموز تعبيرية باعتدال.`
      : `You are a smart, enthusiastic academic advisor for a Benha University student (Faculty of Science, 2021 by-law).
Give an instant, personalized review (150 words) of this registration plan:

📚 Programme: ${data.programName}
📅 Level ${data.level} · ${semStr}
📊 Current GPA: ${data.cumGpa.toFixed(2)} | Earned: ${data.earnedCr} cr
⏱️ Selected: ${data.totalCredits} / ${data.maxCredits} cr (max)
🎯 Predicted GPA: ${data.predictedGpa.toFixed(2)}

Selected courses:
${courseLines}

Start directly with the plan assessment. Highlight specific strengths, any prereq/load warnings, and GPA outlook. Use emojis sparingly.`;

    try {
      const result = streamText({
        model,
        messages: [{ role: "user", content: prompt }],
      });
      for await (const delta of result.textStream) {
        yield { delta };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown";
      console.error("[reviewWizardPlan] error:", msg);
      yield {
        delta: ar
          ? "\n⚠️ حدث خطأ. تأكد من إعداد مفتاح AI وحاول مرة أخرى."
          : "\n⚠️ Error occurred. Check AI key configuration and try again.",
      };
    }
  });
