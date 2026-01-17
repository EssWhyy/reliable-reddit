import { useEffect, useState } from "react";
import { getAIMentions } from "../commentCheck";

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

    checkAI();
  }, []);

  return aiComment;
}