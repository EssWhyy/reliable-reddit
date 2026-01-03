export async function getAIMentions(onFound) {
  try {
    const url = window.location.href.replace(/\/$/, "") + ".json";
    const res = await fetch(url);
    const data = await res.json();

    const comments = data[1].data.children;
    const regex = /\bai\b/i;

    function traverse(list) {
      for (const item of list) {
        if (item.kind !== "t1") continue;

        const body = item.data.body || "";
        if (regex.test(body)) {
          console.log("AI mention found:", body);
          onFound();
          return true; // stop once found
        }

        if (item.data.replies?.data?.children) {
          if (traverse(item.data.replies.data.children)) {
            return true;
          }
        }
      }
      return false;
    }

    traverse(comments);
  } catch (err) {
    console.error("AI comment check failed", err);
  }
}