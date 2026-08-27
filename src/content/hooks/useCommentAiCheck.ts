import { useEffect, useState } from "react";
import { getAIMentions, highlightAiBotComments, removeAiHighlights } from "../commentCheck";

export function useCommentAICheck(comments: any[] | null) {
  const [aiCount, setAiCount] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null); // Start with null to wait for storage read

  useEffect(() => {
    chrome.storage.local.get(["aiHighlightEnabled"], (result) => {
      setIsEnabled(result.aiHighlightEnabled ?? true);
    });

    const listener = (changes: any) => {
      if (changes.aiHighlightEnabled !== undefined) {
        setIsEnabled(changes.aiHighlightEnabled.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    if (isEnabled === null) return;

    if (!isEnabled) {
      setAiCount(0);
      removeAiHighlights();
      return;
    }

    const result = getAIMentions(comments); 
    const count = typeof result === 'number' ? result : 0;
    setAiCount(count);

    highlightAiBotComments();

  }, [isEnabled, comments]);

  return aiCount;
}