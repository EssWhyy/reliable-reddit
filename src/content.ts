function waitForElement(selector: string, callback: (el: Element) => void): void {
  const el = document.querySelector(selector);
  if (el) {
    callback(el);
    return;
  }

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

function calculateVoteComposition(ratio: number, netVotes: number): [number, number] {
  // Returns in the form of [upvotes, downvotes]
  if (ratio <= 0.5) {
    return [0, 0];
  }

  const upvotes = Math.round(netVotes / ratio);
  const downvotes = upvotes - netVotes;

  return [upvotes, downvotes];
}

// Reddit API response structure (simplified)
interface RedditListing {
  data: {
    children: { data: RedditPost }[];
  };
}

interface RedditPost {
  upvote_ratio: number;
  ups: number;
  downs?: number;
}

async function loadPostInfo(): Promise<void> {
  // Only run on post pages
  if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

  // Remove any old box before re-adding
  document.querySelector("#reddit-info-box")?.remove();

  // Construct JSON URL
  const jsonUrl = window.location.href.replace(/\/$/, "") + ".json";

  try {
    const response = await fetch(jsonUrl);
    const data: [RedditListing, unknown] = await response.json();

    const postInfo: RedditPost = data[0].data.children[0].data;
    const ratio = postInfo.upvote_ratio;
    const ups = postInfo.ups;
    const downs = postInfo.downs ?? NaN;

    // Create info box
    const infoBox = document.createElement("div");
    infoBox.id = "reddit-info-box";
    infoBox.style.cssText = `
      padding:10px;
      background:#fff8e1;
      border:1px solid #ccc;
      border-radius:8px;
      margin:10px 0;
      font-size:14px;
      font-family:sans-serif;
    `;


    const [upvotes, downvotes] = calculateVoteComposition(ratio, ups);
    infoBox.innerText = `📊 Upvote ratio: ${ratio * 100}% | 👍 ${upvotes} | 👎 ${downvotes}`;

    console.log(infoBox.innerText)
    // Insert after post title (fallback: body top)
    waitForElement("h1", (titleEl) => {
      console.log('flan')
      titleEl.insertAdjacentElement("afterend", infoBox);
    });
  } catch (e) {
    console.error("Failed to fetch Reddit JSON", e);
  }
}

(function observeUrlChanges() {
  let lastUrl = location.href;

  // Run once on page load
  loadPostInfo();

  // Watch for URL changes
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      loadPostInfo();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
})();
