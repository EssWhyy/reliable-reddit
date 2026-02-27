import { useEffect, useState } from "react";

export interface PostInfo {
  ratio: number;
  upvotes: number;
  downvotes: number;
}

export function usePostVotes() {
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOldReddit, setIsOldReddit] = useState(false);

  useEffect(() => {
    if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

    const fetchVoteData = async () => {
      const u = new URL(window.location.href.replace(/\/$/, ""));
      let jsonUrl = u.origin + u.pathname + ".json";

      if (jsonUrl.includes("old.")) {
        jsonUrl = jsonUrl.replace("www.", "old.");
        setIsOldReddit(true);
      }

      try {
        const response = await fetch(jsonUrl);
        const data = await response.json();

        const postData = data[0].data.children[0].data;
        const ratio = postData.upvote_ratio;
        const ups = postData.ups;

        const estimatedUpvotes = Math.round(ups / ratio);
        const estimatedDownvotes = estimatedUpvotes - ups;

        setPostInfo({
          ratio,
          upvotes: estimatedUpvotes,
          downvotes: estimatedDownvotes,
        });
      } catch {
        setError("Failed to load post info.");
      }
    };

    fetchVoteData();
  }, []);

  return { postInfo, error, isOldReddit };
}