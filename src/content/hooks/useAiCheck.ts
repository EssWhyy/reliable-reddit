import { useEffect, useState } from "react";
import { getAIMentions, highlightAiBotComments } from "../commentCheck";

export function useAICheck() {
  const [aiComment, setAiComment] = useState<{ body: string; permalink: string } | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial check of the setting
    chrome.storage.local.get(["aiHighlightEnabled"], (result) => {
      setIsEnabled(!!result.aiHighlightEnabled);
    });

    // 2. Listen for changes (if user toggles popup while page is open)
    const listener = (changes: any) => {
      if (changes.aiHighlightEnabled) {
        setIsEnabled(changes.aiHighlightEnabled.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    // Only execute logic if the toggle is ON
    if (!isEnabled) {
      setAiComment(null); 
      return;
    }

    const checkAI = async () => {
      const result = await getAIMentions();
      if (result) setAiComment(result);
    };

    const highlightAI = async () => {
      await highlightAiBotComments();
    };

    checkAI();
    highlightAI();
  }, [isEnabled]); // Re-run when toggle changes

  return aiComment;
}