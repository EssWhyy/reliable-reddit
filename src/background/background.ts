import browser from 'webextension-polyfill';

// Type definition for message listener payload options
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

  // Image Classification Handler (Ported from test.py)
  if (msg.type === "AI_IMAGE_CHECK") {
    return new Promise((resolve) => {
      try {
        const payload = msg.payload || {};
        const imageUrl = payload.imageUrl || "";
        const apiKey = String(payload.apiKey || "").trim();

        if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
          resolve({ 
            ok: false, 
            error: "Validation Error: The API Key forwarded to the background service worker is missing or invalid." 
          });
          return;
        }

        if (!imageUrl) {
          resolve({ ok: false, error: "Validation Error: Missing image URL parameter." });
          return;
        }

        const modelId = "Smogy/SMOGY-Ai-images-detector";
        const targetUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;

        console.log(`[BG-PROCESS] Fetching image from URL: ${imageUrl}`);

        // Step 1: Download the raw image binary data
        fetch(imageUrl, {
          headers: {
            // Standard user-agent header override for cross-origin image requests
            "User-Agent": "webextension:reddit-hf-pipeline:v1.0"
          }
        })
        .then(async (imgResponse) => {
          if (!imgResponse.ok) {
            throw new Error(`Failed to download image from source (${imgResponse.status})`);
          }

          const contentType = imgResponse.headers.get("Content-Type") || "image/jpeg";
          const imageBlob = await imgResponse.blob();

          console.log(`[BG-PROCESS] Image downloaded. Sending binary data to Hugging Face model (${modelId})...`);

          // Step 2: Post raw image binary directly to Hugging Face Inference API
          return fetch(targetUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": contentType
            },
            body: imageBlob
          });
        })
        .then(async (hfResponse) => {
          if (!hfResponse.ok) {
            const txt = await hfResponse.text();
            resolve({ ok: false, error: `Hugging Face Server Error (${hfResponse.status}): ${txt}` });
            return;
          }
          const data = await hfResponse.json();
          resolve({ ok: true, data });
        })
        .catch((fetchErr) => {
          resolve({ ok: false, error: `V8 Network Exception: ${fetchErr.name} - ${fetchErr.message}` });
        });

      } catch (criticalErr: any) {
        resolve({ ok: false, error: `Background Thread Exception: ${criticalErr.message}` });
      }
    });
  }

  return false;
});