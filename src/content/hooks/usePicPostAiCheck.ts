import { useState } from "react";
import browser from "webextension-polyfill";

export interface AiCheckResult {
  label: "artificial" | "human" | string;
  score: number;
}

interface BackgroundImageCheckResponse {
  ok: boolean;
  data?: {
    type?: string;
    ai_probability?: number;
    confidence_score?: string;
  };
  error?: string;
}

function normalizeSpaceResult(rawData: unknown): AiCheckResult[] {
  if (Array.isArray(rawData)) {
    return rawData as AiCheckResult[];
  }

  if (rawData && typeof rawData === "object" && "ai_probability" in rawData) {
    const prob = Number((rawData as { ai_probability?: unknown }).ai_probability);
    if (!Number.isNaN(prob)) {
      const clampedAi = Math.min(1, Math.max(0, prob));
      const clampedHuman = Math.min(1, Math.max(0, 1 - clampedAi));
      return [
        { label: "artificial", score: clampedAi },
        { label: "human", score: clampedHuman },
      ];
    }
  }

  throw new Error("Unexpected prediction format returned by ZeroGPU Space.");
}

export function usePicPostAICheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCheckResult[] | null>(null);

  const checkImage = async (imageUrl: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const contextTag = `[AI-PIC-CHECK @ ${new Date().toLocaleTimeString()}]`;
    const trimmedKey = (apiKey || "").trim();

    try {
      if (!imageUrl.trim()) {
        throw new Error("Missing image URL to analyze.");
      }

      const response = (await browser.runtime.sendMessage({
        type: "AI_IMAGE_CHECK",
        payload: {
          apiKey: trimmedKey || undefined,
          imageUrl,
        },
      })) as BackgroundImageCheckResponse | undefined;

      if (!response) {
        throw new Error("No response received from background script.");
      }

      if (!response.ok) {
        throw new Error(response.error || "Background script error during AI check.");
      }

      setResult(normalizeSpaceResult(response.data));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during image check.";
      console.error(`${contextTag} Exception:`, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
  };

  return { checkImage, loading, error, result, reset };
}