import { useEffect, useState } from "react";
import { getAIMentions, highlightAiBotComments } from "../commentCheck";

export function useCommentAICheck(comments: any[] | null) {
  const [aiCount, setAiCount] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.local.get(["aiHighlightEnabled"], (result) => {
      setIsEnabled(!!result.aiHighlightEnabled);
    });

    const listener = (changes: any) => {
      if (changes.aiHighlightEnabled) {
        setIsEnabled(changes.aiHighlightEnabled.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setAiCount(0);
      return;
    }

    const result = getAIMentions(comments); 
    
    const count = Array.isArray(result) ? result.length : (typeof result === 'number' ? result : 0);
    setAiCount(count);

    const highlightAI = async () => {
      await highlightAiBotComments();
    };

    highlightAI();
  }, [isEnabled, comments]);

  return aiCount;
}