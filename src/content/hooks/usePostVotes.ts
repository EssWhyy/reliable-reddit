import { useEffect, useState } from "react";

export interface PostInfo {
  ratio: number;
  upvotes: number;
  downvotes: number;
}

export function usePostVotes() {
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Comments from the same post .json response, shared out so other hooks don't need a duplicate fetch.
  const [comments, setComments] = useState<any[] | null>(null);
  // Derived synchronously from the URL
  const [isOldReddit] = useState(() => window.location.hostname.includes("old."));

  useEffect(() => {
    if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

    const fetchVoteData = async () => {
      const u = new URL(window.location.href.replace(/\/$/, ""));
      let jsonUrl = u.origin + u.pathname + ".json";

      if (isOldReddit) {
        jsonUrl = jsonUrl.replace("www.", "old.");
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

        setComments(data[1]?.data?.children ?? []);
      } catch {
        setError("Failed to load post info.");
      }
    };

    fetchVoteData();
  }, []);

  return { postInfo, error, isOldReddit, comments };
}