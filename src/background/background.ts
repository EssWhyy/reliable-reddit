import browser from 'webextension-polyfill';

interface ExtensionMessage {
  type: string;
  payload?: {
    apiKey?: string;
    text?: string;
    imageUrl?: string;
  };
}

browser.runtime.onMessage.addListener((message: unknown, _sender: any) => {
  const msg = message as ExtensionMessage;

  // Image Classification Handler
  if (msg.type === "AI_IMAGE_CHECK") {
    return new Promise((resolve) => {
      try {
        const payload = msg.payload || {};
        const imageUrl = payload.imageUrl || "";
        const apiKey = String(payload.apiKey || "").trim();

        if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
          console.error("[BG-PROCESS] Validation Error: API key missing or invalid.");
          resolve({ 
            ok: false, 
            error: "Validation Error: The API Key forwarded to the background service worker is missing or invalid." 
          });
          return;
        }

        if (!imageUrl) {
          console.error("[BG-PROCESS] ❌ Validation Error: Missing image URL parameter.");
          resolve({ ok: false, error: "Validation Error: Missing image URL parameter." });
          return;
        }

        const modelId = "Smogy/SMOGY-Ai-images-detector";
        const targetUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
        const cleanApiKey = apiKey.replace(/^["']|["']$/g, '');

        // Download the raw image binary data
        fetch(imageUrl)
          .then(async (imgResponse) => {
            if (!imgResponse.ok) {
              console.error(`[BG-PROCESS] Image download failed with status: ${imgResponse.status}`);
              throw new Error(`Failed to download image from source (${imgResponse.status})`);
            }

            // Convert binary stream directly to ArrayBuffer (matches curl --data-binary)
            const imageBuffer = await imgResponse.arrayBuffer();

            // Post raw ArrayBuffer directly to Hugging Face Inference API
            return fetch(targetUrl, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${cleanApiKey}`,
                "Content-Type": "image/jpeg"
              },
              body: imageBuffer
            });
          })
          .then(async (hfResponse) => {
            if (!hfResponse.ok) {
              const txt = await hfResponse.text();
              console.error(`[BG-PROCESS] Hugging Face API error (${hfResponse.status}):`, txt);
              resolve({ ok: false, error: `Hugging Face Server Error (${hfResponse.status}): ${txt}` });
              return;
            }
            const data = await hfResponse.json();
            resolve({ ok: true, data });
          })
          .catch((fetchErr) => {
            console.error("[BG-PROCESS] Network/Fetch exception:", fetchErr);
            resolve({ ok: false, error: `Network Exception: ${fetchErr.name} - ${fetchErr.message}` });
          });

      } catch (criticalErr: any) {
        console.error("[BG-PROCESS] Background thread exception:", criticalErr);
        resolve({ ok: false, error: `Background Thread Exception: ${criticalErr.message}` });
      }
    });
  }

  return false;
});