import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const msgSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

const input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  contextSummary: z.string().max(4000).default(""),
  messages: z.array(msgSchema).min(1).max(40),
});

export const chatWithAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async function* ({ data }) {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");
    const ar = data.lang === "ar";

    const sys = ar
      ? `أنت مستشار أكاديمي ذكي وودود. أجب بالعربية بإيجاز ووضوح. استخدم Markdown عند الحاجة. هذا ملخص حالة الطالب:\n${data.contextSummary}`
      : `You are a smart, friendly academic advisor. Reply concisely in English. Use Markdown when helpful. Student context:\n${data.contextSummary}`;

    const result = streamText({
      model,
      messages: [{ role: "system", content: sys }, ...data.messages],
    });
    for await (const delta of result.textStream) {
      yield { delta };
    }
  });
