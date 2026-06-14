/// <reference types="chrome" />

import { useState } from 'react';

export function useSentiment() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ label: string; score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = (text: string) => {
    setLoading(true);
    setError(null);

    // Send the text to our background service worker
    chrome.runtime.sendMessage(
      { action: 'ANALYZE_SENTIMENT', text },
      (response) => {
        setLoading(false);
        if (response && response.success) {
          setResult(response.data);
        } else {
          setError(response?.error || 'Failed to analyze sentiment');
        }
      }
    );
  };

  return { analyzeText, result, loading, error };
}