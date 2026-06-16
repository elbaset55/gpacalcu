import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/replit/auth";
import { generateText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway";
import { checkRateLimit } from "./rate-limit";

const input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  uniName: z.string().max(200).default(""),
  major: z.string().max(200).default(""),
  currentLevel: z.number().int().min(1).max(6),
  prevGpa: z.number().min(0).max(4),
  newCr: z.number().int().min(0).max(500),
  totalReq: z.number().int().min(60).max(400),
  gradTarget: z.number().min(0).max(4),
  hasFailed: z.boolean().default(false),
});

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const rl = checkRateLimit(`roadmap:${userId}`, 5, 60_000);
    if (!rl.allowed) {
      throw new Error(
        data.lang === "ar"
          ? `تجاوزت الحد المسموح. حاول بعد ${Math.ceil(rl.retryAfterMs / 1000)} ثانية.`
          : `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      );
    }

    const model = getAiModel("google/gemini-2.5-flash");
    const ar = data.lang === "ar";
    const remCr = Math.max(data.totalReq - data.newCr, 0);

    const sys = ar
      ? `أنت مستشار تخطيط أكاديمي. أنشئ خطة فصلية حتى التخرج للطالب باللغة العربية فقط. التزم بصيغة Markdown منظمة مع جدول لكل فصل قادم. لكل فصل اقترح:
- عدد الساعات (12-21 حسب المعدل: ≥3.0 يسمح 21، 2.0-3.0 يسمح 18، <2.0 فقط 12-14).
- 4-6 أمثلة مواد مناسبة للمستوى (عامة، ليست محددة لتخصص).
- معدل فصلي مستهدف للوصول لـ ${data.gradTarget}.
لا تتجاوز 600 كلمة. اختم بنصيحة قصيرة.`
      : `You are an academic planning advisor. Build a semester-by-semester roadmap to graduation in English. Use clean Markdown with a table per upcoming semester. For each semester suggest:
- Credit load (12-21 based on GPA: ≥3.0 allows 21, 2.0-3.0 allows 18, <2.0 only 12-14).
- 4-6 example courses suitable for the level (generic).
- Target semester GPA to reach ${data.gradTarget}.
Under 600 words. End with a short tip.`;

    const userMsg = JSON.stringify(
      {
        uniName: data.uniName,
        major: data.major,
        currentLevel: data.currentLevel,
        cumGpa: data.prevGpa,
        creditsEarned: data.newCr,
        totalRequired: data.totalReq,
        creditsRemaining: remCr,
        gradTarget: data.gradTarget,
        hasFailedBefore: data.hasFailed,
      },
      null,
      2,
    );

    const { text } = await generateText({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
    });
    return { text };
  });
