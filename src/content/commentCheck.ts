// Detects AI/Bot Related Mentions in Reddit Comments

interface AiComment {
  body: string;
  permalink: string;
}

interface RedditComment {
  kind: string;
  data: {
    body?: string;
    permalink: string;
    replies?: {
      data?: {
        children?: RedditComment[];
      };
    };
  };
}

export async function getAIMentions(): Promise<AiComment | null> {
  try {
    const url = window.location.href.replace(/\/$/, "") + ".json";
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    const comments: RedditComment[] = data[1]?.data?.children ?? [];
    const regex = /\bai\b/i;

    const traverse = (list: RedditComment[]): AiComment | null => {
      for (const item of list) {
        if (item.kind !== "t1") continue;

        const body = item.data.body ?? "";

        if (regex.test(body)) {
          return {
            body,
            permalink: "https://www.reddit.com" + item.data.permalink,
          };
        }

        const replies = item.data.replies?.data?.children;
        if (replies) {
          const found = traverse(replies);
          if (found) return found;
        }
      }
      return null;
    };

    return traverse(comments);
  } catch (err) {
    console.error("AI comment check failed", err);
    return null;
  }
}
