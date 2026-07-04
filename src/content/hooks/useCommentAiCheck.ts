import { useEffect, useState } from "react";
import { getAIMentions, highlightAiBotComments } from "../commentCheck";

export function useCommentAICheck(comments: any[] | null) {
  const [aiComment, setAiComment] = useState<{ body: string; permalink: string } | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.local.get(["aiHighlightEnabled"], (result) => {
      setIsEnabled(!!result.aiHighlightEnabled);
    });

    // Check if user toggles popup while page is open
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
      setAiComment(null);
      return;
    }

    // No extra fetch here — reuses the comment tree usePostVotes already
    // pulled down from the post's .json endpoint.
    const result = getAIMentions(comments);
    setAiComment(result);

    const highlightAI = async () => {
      await highlightAiBotComments();
    };

    highlightAI();
  }, [isEnabled, comments]); // Re-run when toggle changes or comments arrive

  return aiComment;
}