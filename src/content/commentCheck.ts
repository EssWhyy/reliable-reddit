// Detects AI/Bot Related Mentions in Reddit Comments

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
  };
}

// Counts all AI/Bot Mentions in the comment tree
export function getAIMentions(comments: RedditComment[] | null): number {
  if (!comments || comments.length === 0) return 0;

  const regex = /\b(ai|bot)\b/i;
  let matchCount = 0;

  const traverse = (list: RedditComment[]): void => {
    for (const item of list) {
      if (item.kind !== "t1") continue;

      const body = item.data.body ?? "";
      const author = item.data.author ?? "";

      // Skip AutoMod
      if (author.toLowerCase() !== "automoderator" && regex.test(body)) {
        matchCount++;
      }

      // Traverse through nested replies regardless of whether a match was found
      const replies = item.data.replies?.data?.children;
      if (replies && replies.length > 0) {
        traverse(replies);
      }
    }
  };

  try {
    traverse(comments);
    return matchCount;
  } catch (err) {
    console.error("AI comment check failed", err);
    return 0;
  }
}


export function removeAiHighlights(): void {
  const isOldReddit = location.hostname.startsWith("old.");
  const selector = isOldReddit ? ".comment" : "shreddit-comment[depth]";
  
  const commentBoxes = document.querySelectorAll<HTMLElement>(selector);
  commentBoxes.forEach(commentBox => {
    if (commentBox.dataset.aiHighlighted) {
      delete commentBox.dataset.aiHighlighted;
      commentBox.style.outline = "";
      commentBox.style.background = "";
      commentBox.style.borderRadius = "";
    }
  });
}

// This highlights the actual comment boxes on Reddit Post Page, ignores most moderators and bots
export async function highlightAiBotComments(): Promise<void> {
  // Check Chrome Storage state before applying highlights
  const storageResult = await chrome.storage.local.get(["aiHighlightEnabled"]);
  const isEnabled = storageResult.aiHighlightEnabled ?? true;

  if (!isEnabled) {
    removeAiHighlights();
    return;
  }

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

  try {
    const commentBoxes = document.querySelectorAll<HTMLElement>(selectors.commentBox);

    commentBoxes.forEach(commentBox => {
      if (commentBox.dataset.aiHighlighted) return;

      let isModOrApp = false;
      let author = "";

      if (isOldReddit) {
        const authorEl = commentBox.querySelector(".author");
        author = authorEl?.textContent ?? "";
        if (authorEl?.classList.contains("moderator")) isModOrApp = true;
      } else {
        author = commentBox.getAttribute("author") ?? "";
        if (commentBox.hasAttribute("is-moderator")) isModOrApp = true;
      }

      const lowerAuthor = author.toLowerCase();
      if (
        isModOrApp || 
        lowerAuthor === "automoderator" || 
        lowerAuthor.endsWith("_mod") || 
        lowerAuthor.startsWith("mod_")
      ) {
        return; 
      }

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