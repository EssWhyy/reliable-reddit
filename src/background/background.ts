import browser from "webextension-polyfill";

interface ExtensionMessage {
  type: string;
  payload?: {
    apiKey?: string;
    text?: string;
    imageUrl?: string;
    spaceHost?: string;
  };
}

interface GradioFileData {
  path?: string;
  url?: string;
  orig_name?: string;
  mime_type?: string;
  meta: { _type: "gradio.FileData" };
}

const DEFAULT_SPACE_HOST = "esswhyy-reliable-reddit-ai.hf.space";
const GRADIO_API_NAME = "detect_ai";

function sanitizeToken(rawKey?: string): string | null {
  if (!rawKey) return null;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned === "undefined" || cleaned === "null" || cleaned.length < 5) {
    return null;
  }
  return cleaned.startsWith("Bearer ") ? cleaned.slice(7).trim() : cleaned;
}

function buildHeaders(token: string | null, isJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function guessExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return map[mimeType.toLowerCase()] || "jpg";
}

async function uploadImageToGradio(
  baseUrl: string,
  blob: Blob,
  token: string | null
): Promise<GradioFileData> {
  const mimeType = blob.type || "image/jpeg";
  const ext = guessExtension(mimeType);
  const file = new File([blob], `input.${ext}`, { type: mimeType });

  const formData = new FormData();
  formData.append("files", file);

  const uploadRes = await fetch(`${baseUrl}/gradio_api/upload`, {
    method: "POST",
    headers: buildHeaders(token, false),
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gradio file upload failed (${uploadRes.status}): ${errText}`);
  }

  // Gradio returns an array of server file paths, e.g. ["/tmp/gradio/.../input.jpg"]
  const uploadedPaths: string[] = await uploadRes.json();
  if (!Array.isArray(uploadedPaths) || !uploadedPaths[0]) {
    throw new Error("Gradio file upload returned an unexpected response.");
  }

  const serverPath = uploadedPaths[0];
  return {
    path: serverPath,
    url: `${baseUrl}/gradio_api/file=${encodeURIComponent(serverPath)}`,
    orig_name: file.name,
    mime_type: mimeType,
    meta: { _type: "gradio.FileData" },
  };
}

async function streamGradioEvent(
  eventUrl: string,
  token: string | null
): Promise<unknown> {
  const res = await fetch(eventUrl, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gradio stream error (${res.status}): ${errText}`);
  }

  if (!res.body) {
    throw new Error("Gradio response stream has no body.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const dataStr = line.slice(5).trim();
        if (currentEvent === "error") {
          throw new Error(`ZeroGPU inference error: ${dataStr}`);
        }
        if (currentEvent === "complete") {
          const parsed = JSON.parse(dataStr);
          return Array.isArray(parsed) ? parsed[0] : parsed;
        }
      }
    }
  }

  throw new Error("Gradio stream closed before emitting a 'complete' event.");
}

async function handleAiImageCheck(payload: NonNullable<ExtensionMessage["payload"]>) {
  const imageUrl = (payload.imageUrl || "").trim();
  if (!imageUrl) {
    return { ok: false, error: "Validation Error: Missing image URL parameter." };
  }

  const spaceHost = (payload.spaceHost || DEFAULT_SPACE_HOST)
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!spaceHost || spaceHost.includes("YOUR-SPACE-USERNAME")) {
    return { ok: false, error: "Configuration Error: Set your Hugging Face Space host." };
  }

  const token = sanitizeToken(payload.apiKey);
  const baseUrl = `https://${spaceHost}`;

  // 1. Fetch image bytes (ensure host_permissions in manifest includes image hosts)
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    return {
      ok: false,
      error: `Failed to download image (${imgResponse.status} ${imgResponse.statusText})`,
    };
  }
  const imageBlob = await imgResponse.blob();

  // 2. Upload image to Gradio & get FileData descriptor
  const imageFileData = await uploadImageToGradio(baseUrl, imageBlob, token);

  // 3. Submit job to ZeroGPU Space matching detect_ai(input_type, text_content, image_content)
  const callRes = await fetch(`${baseUrl}/gradio_api/call/${GRADIO_API_NAME}`, {
    method: "POST",
    headers: buildHeaders(token, true),
    body: JSON.stringify({
      data: ["image", "", imageFileData],
    }),
  });

  if (!callRes.ok) {
    const errText = await callRes.text();
    return {
      ok: false,
      error: `ZeroGPU Space call error (${callRes.status}): ${errText}`,
    };
  }

  const { event_id } = (await callRes.json()) as { event_id?: string };
  if (!event_id) {
    return { ok: false, error: "ZeroGPU Space did not return an event_id." };
  }

  // 4. Wait for ZeroGPU allocation + inference result via SSE
  const predictionResult = await streamGradioEvent(
    `${baseUrl}/gradio_api/call/${GRADIO_API_NAME}/${event_id}`,
    token
  );

  return { ok: true, data: predictionResult };
}

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ExtensionMessage;

  if (msg?.type === "AI_IMAGE_CHECK") {
    return handleAiImageCheck(msg.payload || {}).catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[BG-PROCESS] AI_IMAGE_CHECK failed:", errorMessage);
      return { ok: false, error: errorMessage };
    });
  }

  return undefined;
});