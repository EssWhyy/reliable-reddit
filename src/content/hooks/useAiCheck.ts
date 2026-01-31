import { useEffect, useState } from "react";
import { getAIMentions, highlightAiBotComments } from "../commentCheck";

export function useAICheck() {
  const [aiComment, setAiComment] = useState<{
    body: string;
    permalink: string;
  } | null>(null);

  useEffect(() => {
    const checkAI = async () => {
      const result = await getAIMentions();
      if (result) setAiComment(result);
    };

    const highlightAI = async () => {
      await highlightAiBotComments()
    }

    checkAI();
    highlightAI();
  }, []);

  return aiComment;
}