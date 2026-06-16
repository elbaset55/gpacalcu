import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/replit/auth";
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
  cgpaBefore: z.number().min(0).max(4).optional(),
  cgpaAfter: z.number().min(0).max(4).optional(),
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

    const cgpaBefore = data.cgpaBefore ?? data.cumGpa;
    const cgpaAfter  = data.cgpaAfter  ?? data.predictedGpa;
    const cgpaDelta  = cgpaAfter - cgpaBefore;
    const cgpaArrow  = cgpaDelta > 0.005
      ? `${cgpaBefore.toFixed(2)} → **${cgpaAfter.toFixed(2)}** ▲${cgpaDelta.toFixed(2)}`
      : cgpaDelta < -0.005
        ? `${cgpaBefore.toFixed(2)} → **${cgpaAfter.toFixed(2)}** ▼${Math.abs(cgpaDelta).toFixed(2)}`
        : `${cgpaBefore.toFixed(2)} → **${cgpaAfter.toFixed(2)}** (مستقر / stable)`;

    const gradeLabel = (gpa: number) => {
      if (gpa >= 3.667) return ar ? "امتياز / Excellent" : "Excellent / امتياز";
      if (gpa >= 3.0)   return ar ? "جيد جداً / Very Good" : "Very Good / جيد جداً";
      if (gpa >= 2.333) return ar ? "جيد / Good" : "Good / جيد";
      if (gpa >= 2.0)   return ar ? "مقبول / Pass" : "Pass / مقبول";
      return ar ? "ضعيف / Below Pass" : "Below Pass / ضعيف";
    };

    const courseLines = data.selectedCourses
      .map((c) => `• ${c.code || "—"} — ${c.name} (${c.credits} cr · ${
        ar
          ? ({ compulsory: "إلزامي", elective: "اختياري", free: "حر", retake: "إعادة", future: "مستقبلي" }[c.type])
          : c.type
      })`)
      .join("\n");

    const prompt = ar
      ? `أنت مستشار أكاديمي ذكي وودود لطالب في جامعة بنها — كلية العلوم لائحة 2021.
قدّم مراجعة فورية وشخصية ومتحمسة (150 كلمة بالضبط) لخطة التسجيل، **باللغة العربية بشكل رئيسي مع مصطلحات إنجليزية عند الحاجة**.

📚 البرنامج: ${data.programName}
📅 المستوى ${data.level} · ${semStr}
📊 **التراكمي CGPA: ${cgpaArrow}** | التصنيف: ${gradeLabel(cgpaAfter)}
📈 الساعات المكتسبة: ${data.earnedCr} | الساعات المختارة: ${data.totalCredits} / ${data.maxCredits}

المقررات المختارة:
${courseLines}

تعليمات الأسلوب:
- ابدأ مباشرةً بجملة تحفيزية تتضمن التغيّر في التراكمي (CGPA: ${cgpaBefore.toFixed(2)} → ${cgpaAfter.toFixed(2)}).
- اذكر نقاط قوة محددة في المقررات المختارة.
- نبّه لأي مقررات ذات شروط سابقة متطلبة.
- اختم بتوقعات إيجابية وتشجيعية للطالب.
- استخدم رموز تعبيرية باعتدال.`
      : `You are a smart, enthusiastic bilingual academic advisor for a Benha University student (Faculty of Science, 2021 by-law).
Give an instant, personalized review (~150 words) of this registration plan, **primarily in English with Arabic phrases where impactful**.

📚 Programme: ${data.programName}
📅 Level ${data.level} · ${semStr}
📊 **CGPA Engine: ${cgpaArrow}** | Standing: ${gradeLabel(cgpaAfter)}
📈 Earned credits: ${data.earnedCr} | Selected: ${data.totalCredits} / ${data.maxCredits} cr

Selected courses:
${courseLines}

Style instructions:
- Open with an energetic sentence explicitly calling out the CGPA shift (${cgpaBefore.toFixed(2)} → ${cgpaAfter.toFixed(2)}).
- Highlight specific course strengths and academic synergies.
- Flag any prerequisite warnings clearly.
- Close with motivational graduation trajectory outlook.
- Use emojis sparingly for impact.`;

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
