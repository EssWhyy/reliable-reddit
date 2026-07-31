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
        // 🔍 DEBUG LOG 1: Log raw message object received
        console.log("[BG-PROCESS] 📥 Message received in background thread:", msg);

        const payload = msg.payload || {};
        const imageUrl = payload.imageUrl || "";
        const apiKey = String(payload.apiKey || "").trim();

        // 🔍 DEBUG LOG 2: Inspect parsed values explicitly
        console.log(`[BG-PROCESS] 🖼️ Extracted Image URL: "${imageUrl}"`);
        console.log(`[BG-PROCESS] 🔑 Extracted API Key length: ${apiKey.length}`);

        if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
          console.error("[BG-PROCESS] ❌ Validation Error: API key missing or invalid.");
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

        // 🔍 DEBUG LOG 3: Confirm URL right before fetch
        console.log(`[BG-PROCESS] 🚀 Initiating fetch for image URL: ${imageUrl}`);

        // Step 1: Download the raw image binary data
        fetch(imageUrl, {
          headers: {
            // Standard user-agent header override for cross-origin image requests
            "User-Agent": "webextension:reddit-hf-pipeline:v1.0"
          }
        })
        .then(async (imgResponse) => {
          if (!imgResponse.ok) {
            console.error(`[BG-PROCESS] ❌ Image download failed with status: ${imgResponse.status}`);
            throw new Error(`Failed to download image from source (${imgResponse.status})`);
          }

          const contentType = imgResponse.headers.get("Content-Type") || "image/jpeg";
          const imageBlob = await imgResponse.blob();

          console.log(`[BG-PROCESS] ✅ Image downloaded successfully (${imageBlob.size} bytes). Sending binary data to Hugging Face model (${modelId})...`);

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
            console.error(`[BG-PROCESS] ❌ Hugging Face API error (${hfResponse.status}):`, txt);
            resolve({ ok: false, error: `Hugging Face Server Error (${hfResponse.status}): ${txt}` });
            return;
          }
          const data = await hfResponse.json();
          console.log("[BG-PROCESS] 🎉 Classification success! Result received:", data);
          resolve({ ok: true, data });
        })
        .catch((fetchErr) => {
          console.error("[BG-PROCESS] 💥 Network/Fetch exception:", fetchErr);
          resolve({ ok: false, error: `V8 Network Exception: ${fetchErr.name} - ${fetchErr.message}` });
        });

      } catch (criticalErr: any) {
        console.error("[BG-PROCESS] 💥 Background thread exception:", criticalErr);
        resolve({ ok: false, error: `Background Thread Exception: ${criticalErr.message}` });
      }
    });
  }

  return false;
});