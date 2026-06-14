import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway";
import { checkRateLimit } from "./rate-limit";

const msgSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

const input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  contextSummary: z.string().max(4000).default(""),
  messages: z.array(msgSchema).min(1).max(40),
});

export const chatWithAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => input.parse(i))
  .handler(async function* ({ data, context }) {
    const { userId } = context;

    const rl = checkRateLimit(`chat:${userId}`, 20, 60_000);
    if (!rl.allowed) {
      yield {
        delta: data.lang === "ar"
          ? `⚠️ تجاوزت الحد المسموح. حاول بعد ${Math.ceil(rl.retryAfterMs / 1000)} ثانية.`
          : `⚠️ Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      };
      return;
    }

    const model = getAiModel("google/gemini-2.5-flash");
    const ar = data.lang === "ar";

    const sys = ar
      ? `أنت مستشار أكاديمي ذكي وودود. أجب بالعربية بإيجاز ووضوح. استخدم Markdown عند الحاجة. هذا ملخص حالة الطالب:\n${data.contextSummary}`
      : `You are a smart, friendly academic advisor. Reply concisely in English. Use Markdown when helpful. Student context:\n${data.contextSummary}`;

    try {
      const result = streamText({
        model,
        messages: [{ role: "system", content: sys }, ...data.messages],
      });

      for await (const delta of result.textStream) {
        yield { delta };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[chatWithAdvisor] streaming error:", msg);
      yield {
        delta: ar
          ? "\n\n⚠️ حدث خطأ أثناء توليد الرد. حاول مرة أخرى."
          : "\n\n⚠️ An error occurred while generating the response. Please try again.",
      };
    }
  });
