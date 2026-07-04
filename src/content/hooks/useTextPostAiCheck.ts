import { useState } from 'react';

export function useTextPostAICheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const checkText = async (text: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Give the (possibly cold-starting) model up to 1 minute to respond.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      // 1. Fetch key from local extension storage
      const storage = await chrome.storage.local.get(['apiKey']);
      const apiKey = storage.apiKey;

      if (!apiKey) {
        throw new Error("Missing API Key. Please configure it in the extension popup.");
      }

      const modelId = "desklib/ai-text-detector-v1.01";
      const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text }),
        signal: controller.signal,
      });

      // Handle Cold Start (Model loading onto Hugging Face memory)
      if (response.status === 503) {
        const errData = await response.json();
        throw new Error(`Model is warming up. Try again in ${errData.estimated_time || 20} seconds.`);
      }

      if (!response.ok) {
        throw new Error(`API Error: Status ${response.status}`);
      }

      const data = await response.json();
      // The model usually returns: [[{ label: "LABEL_0", score: 0.9 }, { label: "LABEL_1", score: 0.1 }]]
      // Clean up or format data structure here based on model label mapping
      setResult(data);

    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("The AI check timed out after 1 minute. Please try again.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return { checkText, loading, error, result };
}