import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getAiModel(preferredModel: string) {
  const geminiKey =
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error(
      "No AI API key configured. Please add the Gemini AI integration in Replit.",
    );
  }

  const baseURL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

  const google = createGoogleGenerativeAI({
    apiKey: geminiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const geminiModel = preferredModel
    .replace("google/", "")
    .replace("-preview", "");
  return google(geminiModel);
}
