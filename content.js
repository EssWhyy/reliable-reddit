function waitForElement(selector, callback) {
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

function calculateVoteComposition(ratio, netVotes) {
  // Returns in the form of upvotes and downvotes
  if (ratio <= 0.5) {
    return [0,0]
  }
  
  const upvotes = Math.round(netVotes / ratio)
  const downvotes = upvotes - netVotes

  return [upvotes, downvotes]
}

async function loadPostInfo() {
  // Only run on post pages
  if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

  // Remove any old box before re-adding
  document.querySelector("#reddit-info-box")?.remove();

  // Construct JSON URL
  const jsonUrl = window.location.href.replace(/\/$/, "") + ".json";

  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const postInfo = data[0].data.children[0].data;
    const ratio = postInfo.upvote_ratio;
    const ups = postInfo.ups;
    const downs = postInfo.downs ?? "N/A";


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

    const upVoteRatio = calculateVoteComposition(ratio, ups)
    const upvotes = upVoteRatio[0]
    const downvotes = upVoteRatio[1]
    infoBox.innerText = `📊 Upvote ratio: ${ratio}% | 👍 ${upvotes} | 👎 ${downvotes}`;

    // Insert after post title (fallback: body top)
    waitForElement("h1", (titleEl) => {
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
