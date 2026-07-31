import { useState } from 'react';
import browser from 'webextension-polyfill';

export interface AiCheckResult {
  label: 'artificial' | 'human' | string;
  score: number;
}

export function usePicPostAICheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCheckResult[] | null>(null);

  const checkImage = async (imageUrl: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const contextTag = `[AI-PIC-CHECK @ ${new Date().toLocaleTimeString()}]`;

    try {
      // 1. Fetch apiKey directly from target web localStorage
      const apiKey = localStorage.getItem('apiKey');

      if (!apiKey) {
        console.warn(`${contextTag} Aborted: Missing API Key in web localStorage.`);
        throw new Error("Missing API Key in web local storage.");
      }

      console.log(`${contextTag} Sending image payload to background script...`);

      // 2. Send request to background script
      let response: any;
      response = await browser.runtime.sendMessage({
        type: "AI_IMAGE_CHECK",
        payload: { apiKey, imageUrl },
      });

      if (!response) {
        throw new Error("No response received from background script.");
      }

      if (!response.ok) {
        throw new Error(response.error || "Background script error during AI check.");
      }

      // Response payload structure:
      // [{'label': 'artificial', 'score': 0.999968409538269}, {'label': 'human', 'score': 3.154538353555836e-05}]
      setResult(response.data);
    } catch (err: any) {
      console.error(`${contextTag} Exception:`, err);
      setError(err.message || "An unexpected error occurred during image check.");
    } finally {
      setLoading(false);
    }
  };

  return { checkImage, loading, error, result };
}