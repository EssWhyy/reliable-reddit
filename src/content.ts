// content.ts
declare global {
  interface Window {
    redditUpvoteBarLoaded?: boolean;
  }
}

export default async function loadPostInfo(): Promise<void> {
  // Prevent duplicate runs
  if (window.redditUpvoteBarLoaded) return;
  window.redditUpvoteBarLoaded = true;

  if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

  // Remove any old box
  document.querySelector("#reddit-info-box")?.remove();

  const jsonUrl = window.location.href.replace(/\/$/, "") + ".json";

  try {
    const response = await fetch(jsonUrl);
    const data: [any, unknown] = await response.json();

    const postInfo = data[0].data.children[0].data;
    const ratio = postInfo.upvote_ratio;
    const ups = postInfo.ups;
    const downs = postInfo.downs ?? NaN;

    const [upvotes, downvotes] = [
      Math.round(ups / ratio),
      Math.round(ups / ratio) - ups,
    ];

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
    infoBox.innerText = `📊 Upvote ratio: ${ratio * 100}% | 👍 ${upvotes} | 👎 ${downvotes}`;

    // Insert after post title
    const titleEl = document.querySelector("h1");
    if (titleEl) titleEl.insertAdjacentElement("afterend", infoBox);
  } catch (e) {
    console.error("Failed to fetch Reddit JSON", e);
  }
}
