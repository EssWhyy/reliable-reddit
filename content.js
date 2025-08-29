function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) {
    callback(el);
    return;
  }

  let lastUrl = location.href;
  
  const observer = new MutationObserver((mutations, me) => {
    const el = document.querySelector(selector);
    if (el) {
      me.disconnect(); // stop observing once found
      callback(el);
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
}

(async () => {

  // Ensure we're on a Reddit post
  if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

  // Construct JSON URL
  const jsonUrl = window.location.href.replace(/\/$/, "") + ".json";

  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const postInfo = data[0].data.children[0].data;
    const ratio = (postInfo.upvote_ratio * 100).toFixed(1);
    const ups = postInfo.ups;
    const downs = postInfo.downs ?? "N/A";

    // Create UI box
    const infoBox = document.createElement("div");
    infoBox.style.cssText = `
      padding:10px;
      background:#fff8e1;
      border:1px solid #ccc;
      border-radius:8px;
      margin:10px 0;
      font-size:14px;
      font-family:sans-serif;
    `;
    
    // TODO: Properly reload bar upon navigating to another page
    // TODO: Calculate the rough number of upvotes and downvotes if positive Upvotes.
    // TODO: Display a bar visualisation for ratio of number upvotes and downvotes
    // TODO: Color Code Upvote Ratio
    // TODO: Options Menu
    // TODO: Work on old Reddit Page as well.
    
    infoBox.innerText = `📊 Upvote ratio: ${ratio}% | 👍 ${ups} | 👎 ${downs}`;
    console.log(infoBox.innerText);

    waitForElement("#post-title-t3_1n29od9", (actionRow) => {
        actionRow.insertAdjacentElement("afterend", infoBox);
    });

  } catch (e) {
    console.error("Failed to fetch Reddit JSON", e);
  }
})();
