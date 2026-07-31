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

  const checkImage = async (imageUrl: string, apiKey: string) => { // 👈 Pass apiKey here
    setLoading(true);
    setError(null);
    setResult(null);

    const contextTag = `[AI-PIC-CHECK @ ${new Date().toLocaleTimeString()}]`;

    try {
      if (!apiKey || apiKey.trim().length < 5) {
        console.warn(`${contextTag} Aborted: Missing or invalid API Key.`);
        throw new Error("Missing or invalid API key. Please set it in extension settings.");
      }

      console.log(`${contextTag} Sending image payload to background script...`);

      // Send request to background script matching background.ts interface
      let response: any
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