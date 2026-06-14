import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createAiProvider() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  if (geminiKey) {
    return createGoogleGenerativeAI({ apiKey: geminiKey });
  }

  if (lovableKey) {
    const lovable = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    return (model: string) => lovable(model);
  }

  throw new Error(
    "No AI API key configured. Please set GEMINI_API_KEY in Replit Secrets.",
  );
}

export function getAiModel(preferredModel: string) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const geminiModel = preferredModel
      .replace("google/", "")
      .replace("-preview", "");
    return google(geminiModel);
  }

  if (lovableKey) {
    const lovable = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    return lovable(preferredModel);
  }

  throw new Error(
    "No AI API key configured. Please set GEMINI_API_KEY in Replit Secrets.",
  );
}

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
