import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/replit/auth";
import { generateText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway";
import { checkRateLimit } from "./rate-limit";

const input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  context: z.object({
    uniName: z.string().max(200).default(""),
    major: z.string().max(200).default(""),
    level: z.number().int().min(1).max(6),
    semester: z.string().max(8),
    prevGpa: z.number().min(0).max(4),
    prevCr: z.number().int().min(0).max(500),
    cumGpa: z.number().min(0).max(4),
    semGpa: z.number().min(0).max(4),
    newCr: z.number().int().min(0).max(500),
    totalReq: z.number().int().min(0).max(500),
    gradTarget: z.number().min(0).max(4),
    gradPredict: z.number().min(0).max(4),
    hasFailed: z.boolean(),
    honorOk: z.boolean(),
    courses: z
      .array(z.object({ name: z.string().max(120), cr: z.number(), grade: z.number() }))
      .max(20)
      .default([]),
    history: z
      .array(z.object({ label: z.string().max(80), gpa: z.number(), cr: z.number() }))
      .max(20)
      .default([]),
  }),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const rl = checkRateLimit(`advisor:${userId}`, 10, 60_000);
    if (!rl.allowed) {
      throw new Error(
        data.lang === "ar"
          ? `تجاوزت الحد المسموح. حاول بعد ${Math.ceil(rl.retryAfterMs / 1000)} ثانية.`
          : `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      );
    }

    const model = getAiModel("google/gemini-2.5-flash");

    const ar = data.lang === "ar";
    const c = data.context;

    const sys = ar
      ? `أنت مستشار أكاديمي خبير. حلّل بيانات الطالب وأعطه نصائح عملية مختصرة وذكية مكتوبة بالعربية بأسلوب ودود ومحفّز. ركّز على:
- تقييم وضعه الحالي (تراكمي، مستوى، تنبؤ التخرج).
- مخاطر/فرص (شرف، رسوب، تذبذب الفصول).
- خطة عملية للفصل القادم بناءً على المستوى ${c.level} والمواد الحالية.
- كم يحتاج معدل فصلي ليصل لهدفه ${c.gradTarget}.
استخدم تنسيق Markdown مع عناوين ونقاط. لا تتجاوز 350 كلمة.`
      : `You are an expert academic advisor. Analyze the student's data and give concise actionable advice in English. Focus on: current standing, risks/opportunities (honors, failure, swings), action plan for next semester at level ${c.level}, and what semester GPA is needed to hit target ${c.gradTarget}. Use markdown headings + bullets. Under 350 words.`;

    const userMsg = JSON.stringify(c, null, 2);

    const { text } = await generateText({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
    });
    return { text };
  });
