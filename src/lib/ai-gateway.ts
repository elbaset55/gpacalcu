import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getAiModel(preferredModel: string) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error(
      "No AI API key configured. Please set GEMINI_API_KEY in Replit Secrets.",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  const geminiModel = preferredModel
    .replace("google/", "")
    .replace("-preview", "");
  return google(geminiModel);
}
