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

//This simply checks if there are any AI/Bot Mentions
export async function getAIMentions(): Promise<AiComment | null> {
  try {
    const url = window.location.href.replace(/\/$/, "") + ".json";
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    console.log('Data fetched: ', data)
    const comments: RedditComment[] = data[1]?.data?.children ?? [];
    const regex = /\b(ai|bot)\b/i;

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

// This highlights the actual comment boxes on Reddit Post Page
export async function highlightAiBotComments(): Promise<void> {
  const isOldReddit = location.hostname.startsWith("old.");

  const selectors = isOldReddit
    ? {
        commentBox: ".comment",
        commentText: ".comment .md",
      }
    : {
        commentBox: "shreddit-comment[depth]",
        commentText: "shreddit-comment[depth] p",
      };

  const keywordRegex = /\b(ai|bot)\b/i;

  const waitForElement = <T extends Element>(
    selector: string,
    timeout = 10000
  ): Promise<T> =>
    new Promise((resolve, reject) => {
      const existing = document.querySelector<T>(selector);
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const el = document.querySelector<T>(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });

  try {
    // Wait for at least one real comment
    await waitForElement(selectors.commentBox);

    const commentBoxes = document.querySelectorAll<HTMLElement>(
      selectors.commentBox
    );

    commentBoxes.forEach(commentBox => {
      if (commentBox.dataset.aiHighlighted) return;

      // Get only the top level comment text element
      const firstCommentEl = commentBox.querySelector<HTMLElement>(selectors.commentText);
      if (!firstCommentEl) return;

      const text = firstCommentEl.innerText;

      if (!keywordRegex.test(text)) return;

      // Mark + highlight
      commentBox.dataset.aiHighlighted = "true";
      commentBox.style.outline = "2px solid #f05816";
      commentBox.style.background = "rgba(255, 152, 0, 0.15)";
      commentBox.style.borderRadius = "8px";
    });
  } catch (err) {
    console.warn("Failed to highlight AI/Bot comments:", err);
  }
}
