interface AiComment {
  body: string;
  permalink: string;
}

interface RedditComment {
  kind: string;
  data: {
    body?: string;
    permalink: string;
    author?: string;
    replies?: {
      data?: {
        children?: RedditComment[];
      };
    };
    score: number;
  };
}

export interface TargetCommentData {
  text: string;
  upvotes: number;
}

//This simply checks if there are any AI/Bot Mentions
export async function getAIMentions(): Promise<AiComment | null> {
  try {
    const cleanUrl = window.location.href
      .replace(/\/deleted_by_user\/?$/, "")
      .replace(/\/$/, "");
      
    const url = cleanUrl + ".json";
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    const comments: RedditComment[] = data[1]?.data?.children ?? [];
    const regex = /\b(ai|bot)\b/i;

    const traverse = (list: RedditComment[]): AiComment | null => {
      for (const item of list) {
        if (item.kind !== "t1") continue;

        const body = item.data.body ?? "";
        const author = item.data.author ?? "";

        // Skip if author is AutoMod
        if (author.toLowerCase() === "automoderator") continue;
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

// This highlights the actual comment boxes on Reddit Post Page, ignores most moderators and bots
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

  const keywordRegex = /\b(ai|(?<!\bI am a )bot)\b/i;

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


      // --- MODERATOR & APP EXCLUSION LOGIC ---
      let isModOrApp = false;
      let author = "";

      if (isOldReddit) {
        const authorEl = commentBox.querySelector(".author");
        author = authorEl?.textContent ?? "";
        
        // Old Reddit tags moderator elements with the "moderator" class
        if (authorEl?.classList.contains("moderator")) {
          isModOrApp = true;
        }
      } else {
        author = commentBox.getAttribute("author") ?? "";
        
        // Modern Reddit uses the "is-moderator" attribute on the shreddit-comment element
        if (commentBox.hasAttribute("is-moderator")) {
          isModOrApp = true;
        }
      }

      const lowerAuthor = author.toLowerCase();

      // Catch AutoModerator, specific known bot accounts, or common automated app naming schemes
      if (
        isModOrApp || 
        lowerAuthor === "automoderator" || 
        lowerAuthor.endsWith("_mod") || 
        lowerAuthor.startsWith("mod_")
      ) {
        return; 
      }

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

// For Sentiment Analysis
export async function extractTargetComments(limitX: number): Promise<TargetCommentData[]> {
  try {
    // Clean up the URL to make a valid Reddit JSON endpoint request
    console.log('flan2')
    const cleanUrl = window.location.href
      .replace(/\/deleted_by_user\/?$/, "")
      .replace(/\/$/, "");
      
    const url = cleanUrl + ".json";
    const res = await fetch(url);

    if (!res.ok) {
      console.warn("Failed to fetch Reddit thread data.");
      return [];
    }

    const data = await res.json();
    // Reddit JSON structure puts the comments in the second array element (index 1)
    const comments: RedditComment[] = data[1]?.data?.children ?? [];

    const extractedData: TargetCommentData[] = [];

    // Helper function to recursively traverse comment replies
    const traverseAndExtract = (list: RedditComment[]) => {
      for (const item of list) {
        // Stop parsing if we've already hit the requested limit
        if (extractedData.length >= limitX) break;

        // "t1" represents actual comments (ignoring things like "more" buttons)
        if (item.kind !== "t1") continue;

        const body = item.data.body ?? "";
        const author = item.data.author ?? "";
        
        // Use Math.max to guarantee upvotes are at least 1 (avoids multiplying by 0 later)
        const upvotes = Math.max(1, item.data.score ?? 1);

        // Filter out empty comments and AutoModerator posts
        if (author.toLowerCase() !== "automoderator" && body.trim().length > 0) {
          extractedData.push({
            text: body,
            upvotes: upvotes
          });
        }

        // If this comment has replies, recursively dig into them
        const replies = item.data.replies?.data?.children;
        if (replies) {
          traverseAndExtract(replies);
        }
      }
    };

    // Run the extraction process
    traverseAndExtract(comments);
    
    return extractedData;

  } catch (err) {
    console.error("Failed to extract target comments:", err);
    return [];
  }
}
